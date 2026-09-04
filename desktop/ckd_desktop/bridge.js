/*
 * electronAPI compatibility shim.
 *
 * Injected into the page once pywebview's own bridge is ready. It reimplements
 * the exact surface electron/electron/preload.ts used to expose, so none of the
 * ~10 React call sites (CouponForm, FruitPayment, MemberPayment, RenewForm,
 * TrainningForm, HoldRequest, TransferRequest, Ticket, EnrollFingerprintModal)
 * need to change.
 *
 * The one thing that could not carry over verbatim is the blob: URL. Every
 * print call site does:
 *     react-to-print renders into a hidden iframe
 *  -> grabs iframe.contentWindow.document.documentElement.outerHTML
 *  -> new Blob([html]) -> URL.createObjectURL(blob)
 *  -> hands that blob: URL to the main process
 * That worked only because Electron's main and renderer shared a session, so a
 * second BrowserWindow could resolve a blob URL minted in the first. A Python
 * host has no such shared registry and cannot dereference blob:.
 *
 * So the shim resolves the blob on the JS side — where it is valid — with
 * fetch(url).text(), and sends the resulting HTML string across. Same input,
 * same output, and the call sites stay untouched.
 */
(function () {
  if (window.electronAPI && window.electronAPI.__ckdPywebview) return;

  const api = () => window.pywebview && window.pywebview.api;

  /* Accepts anything the old bridge accepted: a blob:/data:/http: URL, or raw
     HTML if a future call site skips the Blob dance. */
  async function toHtml(urlOrHtml) {
    if (typeof urlOrHtml !== "string") return "";
    if (/^\s*</.test(urlOrHtml)) return urlOrHtml;
    try {
      const res = await fetch(urlOrHtml);
      return await res.text();
    } catch (e) {
      console.error("[ckd] could not read print payload", urlOrHtml, e);
      throw e;
    }
  }

  async function print(urlOrHtml, callback, copies) {
    let result;
    try {
      result = await api().print_html(await toHtml(urlOrHtml), copies);
    } catch (e) {
      result = { ok: false, error: String(e) };
      console.error("[ckd] print failed", e);
    }
    // The old preload called callback(response) unconditionally.
    if (typeof callback === "function") callback(result);
    // The call sites only console.log the response, so a failed print used to
    // be invisible at the counter. Say so.
    if (!result || !result.ok) {
      window.alert("Print failed: " + ((result && result.error) || "unknown error") +
        "\n\nCheck the printer under Printer in the menu.");
    }
    return result;
  }

  const fpListeners = new Set();
  window.addEventListener("ckd-fp", (e) => {
    for (const cb of Array.from(fpListeners)) {
      try { cb(e.detail); } catch (err) { console.error("[ckd] fp listener threw", err); }
    }
  });

  window.electronAPI = {
    __ckdPywebview: true,

    printComponent: (url, callback) => print(url, callback, 2),
    printComponent1: (url, callback) => print(url, callback, 1),
    previewComponent: async (url, callback) => {
      let result;
      try {
        result = await api().preview_html(await toHtml(url));
      } catch (e) {
        result = { ok: false, error: String(e) };
      }
      if (typeof callback === "function") callback(result);
      return result;
    },

    // Printer page (pages/Settings/Printers.tsx).
    listPrinters: () => api().list_printers(),
    getPrintSettings: () => api().get_print_settings(),
    setPrintSettings: (printer) => api().set_print_settings(printer),
    printTest: (printer) => api().print_test(printer),

    fpBegin: (customerId) => api().fp_begin(customerId),
    fpCancel: () => api().fp_cancel(),
    // Returns an unsubscribe function, matching the old ipcRenderer contract.
    onFpEvent: (cb) => {
      fpListeners.add(cb);
      return () => fpListeners.delete(cb);
    },
  };

  console.info("[ckd] electronAPI shim ready (pywebview host)");
})();
