import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { PrintCommand, SCHEMA_VERSION, WorkerResult } from "./types";

/**
 * Supervises the Python print worker and speaks its newline-JSON protocol.
 *
 * Same arrangement as desktop/ckd_desktop/fp_enroll.py, which this codebase
 * already runs: one child process, one JSON object per line, stdout reserved
 * for protocol traffic and diagnostics on stderr. A child process rather than
 * an HTTP service means no port, no shared secret and no auth surface — and one
 * child means one consumer, so spooler access is serialised and job ordering is
 * free.
 *
 * The worker lives OUTSIDE the deploy tree (PRINT_WORKER_DIR, default
 * D:\CKD-System\shared\print-worker) because Windows locks a running .exe and a
 * mirroring deploy over the app directory would fail or skip it.
 */

const RESTART_DELAY_MS = 5000;
const REQUEST_TIMEOUT_MS = 60_000;

export class PrintWorker {
    private child: ChildProcessWithoutNullStreams | null = null;
    private buffer = "";
    private pending = new Map<number, (r: WorkerResult) => void>();
    private ready = false;
    private stopped = false;
    private lastError: string | null = null;

    constructor(
        private readonly exePath: string,
        private readonly args: string[] = []
    ) {}

    /** Where the child runs. For `python -m ckd_print` this must be the package root. */
    private get cwd(): string {
        return process.env.PRINT_WORKER_CWD
            ? path.resolve(process.env.PRINT_WORKER_CWD)
            : path.dirname(this.exePath);
    }

    get available(): boolean {
        return this.ready && this.child !== null;
    }

    get error(): string | null {
        return this.lastError;
    }

    start(): void {
        if (this.stopped || this.child) return;

        if (!fs.existsSync(this.exePath)) {
            this.lastError = `print worker not found at ${this.exePath}`;
            console.warn(`[print] ${this.lastError} — printing is disabled`);
            return;
        }

        // Always a real executable, never a .cmd, and never shell: true.
        // Node refuses to spawn batch files since the CVE-2024-27980 fix
        // (EINVAL), and routing through cmd.exe breaks on the spaces in
        // "C:\Users\Legion Go\...". In production this is the frozen
        // ckd-print-worker.exe with no arguments; in development it is
        // python.exe with ["-m", "ckd_print"] via PRINT_WORKER_ARGS.
        const child = spawn(this.exePath, this.args, {
            cwd: this.cwd,
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true,
        }) as ChildProcessWithoutNullStreams;

        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk: string) => this.onData(chunk));
        // The worker logs to stderr by design; surface it but never parse it.
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (d: string) => {
            const line = d.trim();
            if (line) console.log(`[print-worker] ${line}`);
        });

        child.on("exit", (code) => {
            console.warn(`[print] worker exited (${code})`);
            this.child = null;
            this.ready = false;
            // Fail anything in flight rather than leaving a caller hanging.
            for (const [jobId, resolve] of this.pending) {
                resolve({ type: "result", job_id: jobId, ok: false, retryable: true,
                          error: "worker exited mid-job" });
            }
            this.pending.clear();
            if (!this.stopped) setTimeout(() => this.start(), RESTART_DELAY_MS);
        });

        child.on("error", (err) => {
            this.lastError = String(err);
            console.error("[print] worker failed to start:", err);
        });

        this.child = child;
    }

    stop(): void {
        this.stopped = true;
        if (this.child) {
            try {
                this.child.stdin.write(JSON.stringify({ cmd: "quit" }) + "\n");
            } catch {
                /* already gone */
            }
            this.child.kill();
            this.child = null;
        }
    }

    private onData(chunk: string): void {
        this.buffer += chunk;
        let idx: number;
        while ((idx = this.buffer.indexOf("\n")) >= 0) {
            const line = this.buffer.slice(0, idx).trim();
            this.buffer = this.buffer.slice(idx + 1);
            if (!line) continue;
            let msg: any;
            try {
                msg = JSON.parse(line);
            } catch {
                console.warn("[print] non-JSON from worker:", line.slice(0, 200));
                continue;
            }
            if (msg.type === "ready") {
                this.ready = true;
                this.lastError = null;
                if (msg.schema !== SCHEMA_VERSION) {
                    // Deployed separately from the backend, so drift is possible.
                    this.lastError =
                        `worker schema ${msg.schema} != backend ${SCHEMA_VERSION} — redeploy the print worker`;
                    this.ready = false;
                    console.error(`[print] ${this.lastError}`);
                } else {
                    console.log(`[print] worker ready (printer=${msg.printer}, dump=${!!msg.dump_mode})`);
                }
                continue;
            }
            if (msg.type === "result" && typeof msg.job_id === "number") {
                const resolve = this.pending.get(msg.job_id);
                if (resolve) {
                    this.pending.delete(msg.job_id);
                    resolve(msg as WorkerResult);
                }
            }
        }
    }

    print(cmd: Omit<PrintCommand, "cmd" | "schema">): Promise<WorkerResult> {
        return new Promise((resolve) => {
            if (!this.child || !this.ready) {
                resolve({ type: "result", job_id: cmd.job_id, ok: false, retryable: true,
                          error: this.lastError ?? "print worker not running" });
                return;
            }

            const timer = setTimeout(() => {
                if (this.pending.delete(cmd.job_id)) {
                    resolve({ type: "result", job_id: cmd.job_id, ok: false, retryable: true,
                              error: `worker did not answer within ${REQUEST_TIMEOUT_MS}ms` });
                }
            }, REQUEST_TIMEOUT_MS);

            this.pending.set(cmd.job_id, (r) => {
                clearTimeout(timer);
                resolve(r);
            });

            const payload: PrintCommand = { cmd: "print", schema: SCHEMA_VERSION, ...cmd };
            try {
                this.child.stdin.write(JSON.stringify(payload) + "\n");
            } catch (err) {
                this.pending.delete(cmd.job_id);
                clearTimeout(timer);
                resolve({ type: "result", job_id: cmd.job_id, ok: false, retryable: true,
                          error: `write failed: ${err}` });
            }
        });
    }
}
