import { toast, ToastOptions } from 'react-toastify';
import { showErrorDialog } from './errorDialog';

// Default toast configuration
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Success toast
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultOptions,
    ...options,
  });
};

/**
 * Errors surface as a modal, not a toast — a toast can auto-dismiss before it
 * is read. Kept under the original name so the ~450 existing call sites need no
 * change; `options` is accepted and ignored for the same reason.
 */
export const showErrorToast = (message: string, _options?: ToastOptions) => {
  showErrorDialog(message);
};

/**
 * Extract a human-readable message from any error (axios, fetch, FastAPI 422, etc.).
 *
 * Handles these shapes:
 *   - FastAPI 422:  { detail: "Validation error", errors: [{ loc, msg, type }] }
 *   - FastAPI std:  { detail: "Something went wrong" }
 *   - FastAPI list: { detail: [{ loc, msg }] }
 *   - Plain Error:  { message: "..." }
 *   - String fallback
 */
export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  const e = err as {
    response?: { data?: unknown; status?: number };
    message?: string;
  };
  const data = e.response?.data as
    | { detail?: unknown; errors?: Array<{ loc?: unknown[]; msg?: string; type?: string }>; message?: string }
    | undefined;

  // FastAPI 422 with errors array (our custom handler shape)
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((v) => {
        const field = Array.isArray(v.loc) ? v.loc.filter((x) => x !== 'body').join('.') : '';
        return field ? `${field}: ${v.msg ?? 'invalid'}` : (v.msg ?? 'invalid');
      })
      .join('; ');
  }

  // FastAPI default 422: detail is an array of validation errors
  if (data && Array.isArray(data.detail)) {
    return data.detail
      .map((v) => {
        const field = Array.isArray(v?.loc) ? v.loc.filter((x: unknown) => x !== 'body').join('.') : '';
        return field ? `${field}: ${v?.msg ?? 'invalid'}` : (v?.msg ?? 'invalid');
      })
      .join('; ');
  }

  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (typeof e.message === 'string') return e.message;
  return fallback;
}

/** Show an error toast with a best-effort human message extracted from the error. */
export const showErrorFromException = (err: unknown, fallback?: string, options?: ToastOptions) => {
  showErrorToast(extractErrorMessage(err, fallback), options);
};

// Warning toast
export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    ...defaultOptions,
    ...options,
  });
};

// Info toast
export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    ...defaultOptions,
    ...options,
  });
};

// Default toast
export const showToast = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...defaultOptions,
    ...options,
  });
};

// Promise toast - useful for async operations
export const showPromiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    pending: string;
    success: string;
    error: string;
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      pending: messages.pending,
      success: messages.success,
      error: messages.error,
    },
    {
      ...defaultOptions,
      ...options,
    }
  );
};
