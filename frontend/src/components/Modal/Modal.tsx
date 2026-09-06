import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


interface ModalProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  onConfirm: () => void
  onCancel: () => void
  children: React.ReactElement
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  /** The confirm button's variant — `commit` for a sale, `default` otherwise. */
  confirmVariant?: "default" | "commit" | "destructive"
}

/** Confirm / cancel dialog around any content. */
const Modal = ({
  open,
  setOpen,
  onConfirm,
  onCancel,
  children,
  title,
  confirmLabel = "យល់ព្រម",
  cancelLabel = "បោះបង់",
  confirmVariant = "default",
}: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className={title ? undefined : "sr-only"}>
          <DialogTitle>{title ?? confirmLabel}</DialogTitle>
        </DialogHeader>
        <div>
          {children}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setOpen(false); onCancel(); }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={() => { onConfirm(); }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
