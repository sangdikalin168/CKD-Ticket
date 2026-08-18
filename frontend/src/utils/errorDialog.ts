import Swal from 'sweetalert2';
/**
 * Errors are shown as a modal rather than a toast: a toast can scroll past or
 * auto-dismiss before it is read, and a failed save is worth interrupting for.
 *
 * SweetAlert2 shows one modal at a time — firing a second while one is open
 * silently replaces it. Errors often arrive in bursts (a Promise.all where
 * several requests fail), so they are queued and shown one after another, with
 * exact duplicates collapsed.
 */

const pending: string[] = [];
/** The message on screen right now — deduped against, since it has left `pending`. */
let onScreen: string | null = null;
let showing = false;

/** Bridges SweetAlert2 to the app's own theme tokens; styled in index.css. */
const customClass = {
  popup: 'app-swal-popup',
  title: 'app-swal-title',
  htmlContainer: 'app-swal-text',
  confirmButton: 'app-swal-confirm',
  actions: 'app-swal-actions',
};

async function drain(): Promise<void> {
  if (showing) return;
  showing = true;
  try {
    while (pending.length > 0) {
      onScreen = pending.shift() as string;
      await Swal.fire({
        icon: 'error',
        title: 'កំហុស',
        text: onScreen,
        confirmButtonText: 'បិទ',
        buttonsStyling: false,
        customClass,
        heightAuto: false, // otherwise SweetAlert2 mutates <body> height and shifts the page
      });
      onScreen = null;
    }
  } finally {
    onScreen = null;
    showing = false;
  }
}

/** Show `message` in an error modal. Repeated identical messages collapse into one. */
export function showErrorDialog(message: string): void {
  const text = (message || '').trim();
  if (!text) return;
  if (text === onScreen || pending.includes(text)) return;
  pending.push(text);
  void drain();
}
