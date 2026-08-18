import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XMarkIcon as X } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useOverlay } from './OverlayStack';

/**
 * Radix marks <body> `pointer-events: none` while a modal layer is open and
 * clears it on close. Opening a dialog from a dropdown menu interleaves two
 * layers' teardown, and the style can be left behind — the whole page stops
 * responding to clicks until a reload.
 *
 * Once the dialog closes and no other Radix layer remains mounted, drop the
 * leftover style. The DOM check keeps stacked overlays working: while any
 * dialog, menu or popover is still open, Radix's own value is left alone.
 */
const useReleaseStuckPointerEvents = (open: boolean) => {
  React.useEffect(() => {
    if (open) return;
    const frame = requestAnimationFrame(() => {
      if (document.body.style.pointerEvents !== 'none') return;
      const layerStillOpen = document.querySelector(
        '[data-radix-popper-content-wrapper], [data-state="open"][role="dialog"], [data-state="open"][role="menu"]',
      );
      if (!layerStillOpen) document.body.style.removeProperty('pointer-events');
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const;

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'md'
}) => {
  // Radix supplies focus trap, focus restore, aria wiring, and body scroll
  // lock. The OverlayStack still owns z-order and gates Escape so stacked
  // overlays (dialog + confirm + loading) close one at a time, topmost first.
  const { zIndex, isTopmost } = useOverlay('dialog', open);
  useReleaseStuckPointerEvents(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* Content nests inside Overlay (Radix scrollable-overlay pattern) so
            the flex centering + edge padding layout carries over unchanged. */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/60 flex items-center justify-center animate-fadeIn p-2 sm:p-4"
          style={{ height: '100dvh', zIndex }}
        >
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onEscapeKeyDown={(e) => { if (!isTopmost) e.preventDefault(); }}
            className={cn(
              'bg-card rounded-lg shadow-xl border border-border w-full flex flex-col animate-slideUp focus:outline-none',
              maxWidthClasses[maxWidth]
            )}
            style={{ maxHeight: 'calc(100dvh - 16px)' }}
          >
            <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b border-border shrink-0">
              <DialogPrimitive.Title className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                aria-label={'បិទ'}
              >
                <X className="size-5 md:size-6" />
              </DialogPrimitive.Close>
            </div>
            <div className="overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6 flex-1">
              {children}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export interface DialogFooterProps {
  children: React.ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children }) => {
  return (
    <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-card pt-3 sm:pt-4 border-t border-border -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-0">
      {children}
    </div>
  );
};

// Confirmation Dialog Component
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  loadingText?: string;
  /** Drop the cancel button — for telling the user something, not asking them. */
  hideCancel?: boolean;
}

const confirmButtonVariant = {
  danger: 'destructive',
  warning: 'warning',
  info: 'info',
} as const;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning',
  isLoading = false,
  loadingText,
  hideCancel = false,
}) => {
  const { zIndex, isTopmost } = useOverlay('confirm', open);
  useReleaseStuckPointerEvents(open);

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          style={{ zIndex }}
        >
          <DialogPrimitive.Content
            onEscapeKeyDown={(e) => { if (!isTopmost) e.preventDefault(); }}
            className="bg-card p-6 rounded-lg shadow-xl border border-border max-w-md w-full mx-4 focus:outline-none"
          >
            <DialogPrimitive.Title className="text-xl font-semibold text-foreground mb-4">
              {title ?? 'បញ្ជាក់សកម្មភាព'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground mb-6">
              {message}
            </DialogPrimitive.Description>

            <div className="flex justify-end gap-3">
              {!hideCancel && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText ?? 'បោះបង់'}
                </Button>
              )}
              <Button
                variant={hideCancel ? 'default' : confirmButtonVariant[variant]}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (loadingText ?? 'កំពុងដំណើរការ...') : (confirmText ?? 'បញ្ជាក់')}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

// Hook for managing dialog state
export const useDialog = () => {
  const [open, setOpen] = React.useState(false);

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);
  const toggleDialog = () => setOpen(prev => !prev);

  return {
    open,
    openDialog,
    closeDialog,
    toggleDialog,
  };
};

// Hook for managing confirm dialog with promise-based API
export const useConfirmDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    hideCancel?: boolean;
  }>({
    message: '',
  });
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    hideCancel?: boolean;
  }): Promise<boolean> => {
    setConfig(options);
    setOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  /** Tell the user something they can only acknowledge — one button, no choice. */
  const alert = (options: {
    title?: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }): Promise<void> =>
    confirm({ ...options, hideCancel: true }).then(() => undefined);

  const handleClose = () => {
    setOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  const handleConfirm = () => {
    setOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  };

  return {
    open,
    config,
    confirm,
    alert,
    handleClose,
    handleConfirm,
    ConfirmDialog: () => (
      <ConfirmDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...config}
      />
    ),
  };
};
