import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Max height as a fraction of viewport (default 0.9) */
  maxHeight?: number;
  /** Show grab handle at top (default true) */
  showHandle?: boolean;
  /** Show close button (default true) */
  showClose?: boolean;
  /** Disable backdrop dismiss (default false) */
  disableBackdropClose?: boolean;
}

/**
 * Mobile-first bottom sheet — slides up from the bottom edge.
 *
 * - Renders via portal so it can't be clipped by parent overflow
 * - Auto-locks body scroll while open
 * - Backdrop click + grab-handle drag-to-close (drag is touch-only)
 * - Falls back to centered modal on screens >= md (768px) so it works on
 *   desktop too (manager desktop mode)
 *
 * Usage:
 *   <BottomSheet open={open} onClose={close} title="Vibol Kim">
 *     <div>Content...</div>
 *   </BottomSheet>
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  maxHeight = 0.9,
  showHandle = true,
  showClose = true,
  disableBackdropClose = false,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragOffset = useRef<number>(0);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableBackdropClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, disableBackdropClose]);

  // Touch drag-to-close (only triggers on the handle area)
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) {
      dragOffset.current = delta;
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };
  const handleTouchEnd = () => {
    if (!sheetRef.current) return;
    if (dragOffset.current > 120) {
      onClose();
    }
    sheetRef.current.style.transform = '';
    dragStartY.current = null;
    dragOffset.current = 0;
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !disableBackdropClose && onClose()}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="
          relative w-full md:max-w-lg
          bg-white dark:bg-zinc-900
          rounded-t-3xl md:rounded-2xl
          shadow-2xl
          animate-in slide-in-from-bottom md:zoom-in-95 duration-300
          flex flex-col
        "
        style={{ maxHeight: `${maxHeight * 100}vh` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle (mobile) */}
        {showHandle && (
          <div
            className="md:hidden flex justify-center pt-2 pb-1 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
        )}

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            {title ? (
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white truncate">{title}</h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={'បិទ'}
                className="p-1.5 -mr-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BottomSheet;

