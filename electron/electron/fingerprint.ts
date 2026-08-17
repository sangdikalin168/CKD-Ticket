/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fingerprint enrollment sidecar manager (main process).
 *
 * Spawns the Python ZKFinger helper (`python/fp_enroll.py` in dev, a bundled
 * `fp_enroll.exe` when packaged) as a child process and bridges it to the
 * renderer:
 *   - renderer -> here (IPC `fp-begin`/`fp-cancel`) -> child stdin JSON commands
 *   - child stdout JSON events -> here -> renderer (`fp-event` via webContents)
 *
 * The child is kept alive across enrollments (spawned lazily, re-spawned if it
 * dies). The renderer performs the actual save (checkinSaveFingerprint mutation),
 * so this layer is purely hardware transport.
 */
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'

type FpEvent = Record<string, any>

let child: ChildProcess | null = null
let targetWin: any = null
let stdoutBuf = ''
let enrolling = false

/** Bind the window that fingerprint events are delivered to. */
export function initFingerprint(win: any): void {
  targetWin = win
}

function sidecarCommand(): { cmd: string; args: string[] } {
  const override = process.env.FP_SIDECAR_PATH
  if (override) {
    return override.toLowerCase().endsWith('.py')
      ? { cmd: process.env.PYTHON || 'python', args: [override] }
      : { cmd: override, args: [] }
  }
  if (app.isPackaged) {
    return { cmd: path.join(process.resourcesPath, 'fp_enroll.exe'), args: [] }
  }
  // dev: built main.js lives in electron/dist-electron -> ../python/fp_enroll.py
  const script = path.join(__dirname, '../python/fp_enroll.py')
  return { cmd: process.env.PYTHON || 'python', args: [script] }
}

function sendEvent(evt: FpEvent): void {
  if (
    evt &&
    (evt.type === 'enroll_complete' ||
      evt.type === 'enroll_error' ||
      evt.type === 'enroll_cancelled')
  ) {
    enrolling = false
  }
  try {
    targetWin?.webContents?.send('fp-event', evt)
  } catch {
    /* window already gone */
  }
}

function handleStdout(chunk: string): void {
  stdoutBuf += chunk
  let idx: number
  // Only parse complete, newline-terminated lines (chunks can split a line).
  while ((idx = stdoutBuf.indexOf('\n')) >= 0) {
    const line = stdoutBuf.slice(0, idx).trim()
    stdoutBuf = stdoutBuf.slice(idx + 1)
    if (!line) continue
    try {
      sendEvent(JSON.parse(line))
    } catch {
      console.error('[fp] unparseable event line:', line)
    }
  }
}

function ensureChild(): ChildProcess | null {
  if (child && !child.killed && child.exitCode === null) return child

  const { cmd, args } = sidecarCommand()
  try {
    child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  } catch (e: any) {
    child = null
    sendEvent({
      type: 'enroll_error',
      message: `failed to start fingerprint helper: ${e?.message || e}`,
    })
    return null
  }

  stdoutBuf = ''
  child.stdout?.setEncoding('utf-8')
  child.stdout?.on('data', handleStdout)
  child.stderr?.setEncoding('utf-8')
  child.stderr?.on('data', (d: string) => console.error('[fp]', String(d).trimEnd()))
  child.on('error', (e: any) => {
    sendEvent({
      type: 'enroll_error',
      message: `fingerprint helper error: ${e?.message || e}`,
    })
    child = null
  })
  child.on('exit', (code) => {
    if (enrolling) {
      sendEvent({
        type: 'enroll_error',
        message: `fingerprint helper exited (code ${code})`,
      })
    }
    child = null
  })
  return child
}

function writeCmd(obj: any): boolean {
  const c = ensureChild()
  if (!c || !c.stdin) return false
  try {
    c.stdin.write(JSON.stringify(obj) + '\n')
    return true
  } catch {
    return false
  }
}

export function fpBegin(customerId: number): { ok: boolean; error?: string } {
  if (!Number.isFinite(customerId) || customerId <= 0) {
    return { ok: false, error: 'invalid customer id' }
  }
  enrolling = true
  if (!writeCmd({ cmd: 'begin', customer_id: customerId })) {
    enrolling = false
    return { ok: false, error: 'fingerprint helper not available' }
  }
  return { ok: true }
}

export function fpCancel(): { ok: boolean } {
  if (child) writeCmd({ cmd: 'cancel' })
  enrolling = false
  return { ok: true }
}

/** Quit + kill the child (call on window close / app quit). */
export function disposeFingerprint(): void {
  enrolling = false
  if (!child) return
  const c = child
  child = null
  try {
    c.stdin?.write(JSON.stringify({ cmd: 'quit' }) + '\n')
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    try {
      c.kill()
    } catch {
      /* ignore */
    }
  }, 500)
}
