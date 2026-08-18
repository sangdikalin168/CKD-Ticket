/**
 * Filesystem locations for server-owned state.
 *
 * "Server-owned" means data the SERVER accumulates at runtime and that no
 * deploy may ever touch — as opposed to application code, which every deploy
 * replaces wholesale. Member photos are the only such data here today.
 *
 * The problem this module exists to fix: the upload path used to be derived
 * from __dirname at three separate call sites, which put uploads INSIDE the
 * deployable tree (backend/uploads, a sibling of backend/src). Any deploy that
 * mirrors or replaces the app directory — robocopy /MIR, an rsync --delete, a
 * release-directory swap, or just unzipping a build over the top — deletes
 * every member photo on the machine, silently, with no error.
 *
 * So the directory is configurable and is meant to live OUTSIDE whatever the
 * deploy writes to. On the production Windows box the recommended layout is:
 *
 *     D:\CKD-System\shared\uploads      <- UPLOADS_DIR, never deployed to
 *     D:\CKD-System\releases\<version>  <- code, replaced every deploy
 *     D:\CKD-System\current             <- junction -> the active release
 *
 * Set it in backend/prod.env:
 *
 *     UPLOADS_DIR=D:\CKD-System\shared\uploads
 *
 * The default keeps the historical location (backend/uploads) so nothing
 * breaks before that move happens — but the default is the unsafe one, which
 * is why startup logs a warning when the uploads dir sits inside the app tree.
 */
import fs from "fs";
import path from "path";

/** Root of the backend app (the directory holding src/ or dist/). */
const APP_ROOT = path.resolve(__dirname, "../..");

/** Public URL prefix these files are served under. Kept in sync with the
 *  express.static mount and with the `/uploads/...` paths stored in the DB. */
export const UPLOADS_URL_PREFIX = "/uploads";

export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(APP_ROOT, "uploads");

export const MEMBER_PHOTOS_DIR = path.join(UPLOADS_DIR, "members");

/**
 * Create the upload directories if missing, and warn when they sit somewhere a
 * deploy is likely to overwrite. Called once at boot.
 */
export function ensureUploadDirs(): void {
  fs.mkdirSync(MEMBER_PHOTOS_DIR, { recursive: true });

  const insideAppTree = !path.relative(APP_ROOT, UPLOADS_DIR).startsWith("..");
  if (insideAppTree) {
    console.warn(
      `[uploads] ${UPLOADS_DIR} is inside the application directory. A deploy ` +
        `that replaces the app tree will delete uploaded files. Set UPLOADS_DIR ` +
        `to a path outside it (e.g. D:\\CKD-System\\shared\\uploads).`
    );
  } else {
    console.log(`[uploads] serving from ${UPLOADS_DIR}`);
  }
}

/**
 * Turn a stored DB path ("/uploads/members/member_1_2.jpg") into a real file
 * path under UPLOADS_DIR.
 *
 * Returns null if the value is not an uploads path or if it escapes the
 * uploads directory. The old code did path.join(__dirname, "../../", dbPath)
 * and then unlinked the result, so a stored value containing ".." would have
 * deleted an arbitrary file; the containment check below is what prevents that.
 */
export function resolveUploadPath(dbPath: string | null | undefined): string | null {
  if (!dbPath || !dbPath.startsWith(`${UPLOADS_URL_PREFIX}/`)) return null;

  const relative = dbPath.slice(UPLOADS_URL_PREFIX.length + 1);
  const resolved = path.resolve(UPLOADS_DIR, relative);

  const contained = !path.relative(UPLOADS_DIR, resolved).startsWith("..");
  return contained ? resolved : null;
}

/**
 * Where published desktop-client builds live (CKD-Ticket.exe + latest.json).
 *
 * Server-owned like uploads, and for the same reason: a deploy replaces the app
 * tree, and the installer must survive it. Defaults next to UPLOADS_DIR so the
 * one "shared" directory holds everything a deploy must not touch.
 *
 * Deliberately NOT behind requireAuthForUploads: the updater runs before anyone
 * has logged in and has no token to send. The exe contains no secrets, and the
 * manifest is just a version and a hash.
 */
export const DESKTOP_DIR = process.env.DESKTOP_DIR
  ? path.resolve(process.env.DESKTOP_DIR)
  : path.join(path.dirname(UPLOADS_DIR), "desktop");

export const DESKTOP_URL_PREFIX = "/desktop";

export function ensureDesktopDir(): void {
  fs.mkdirSync(DESKTOP_DIR, { recursive: true });
}

/**
 * The Python print worker.
 *
 * Lives outside the deploy tree for a hard Windows reason: a running .exe
 * cannot be overwritten, so a mirroring deploy over the app directory would
 * fail or silently skip it. Deployed separately, like the uploads it sits
 * beside — which is also why worker and backend can drift, and why the wire
 * protocol carries a schema version.
 */
export const PRINT_WORKER_DIR = process.env.PRINT_WORKER_DIR
  ? path.resolve(process.env.PRINT_WORKER_DIR)
  : path.join(path.dirname(UPLOADS_DIR), "print-worker");

export const PRINT_WORKER_EXE = process.env.PRINT_WORKER_EXE
  ? path.resolve(process.env.PRINT_WORKER_EXE)
  : path.join(PRINT_WORKER_DIR, "ckd-print-worker.exe");
