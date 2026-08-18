import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * OverlayStack — central registry that hands out z-indexes to overlays as
 * they mount, so stacking order tracks open order (not DOM insertion order).
 *
 * Why: every overlay in this app (Dialog, ConfirmDialog, LoadingOverlay,
 * dropdowns, popovers) sat at a static `z-50`. Stacking among equal
 * z-index elements falls back to DOM order — fragile when a popover/loader
 * mounts between two dialogs, or when React reconciliation reorders portal
 * children. The fix: every overlay registers here, gets a depth in a shared
 * stack, and resolves to `BASE + depth`. The most recently opened overlay
 * always wins.
 *
 * Also routes the Escape key to the topmost overlay only.
 */

export type OverlayType = 'popover' | 'loading' | 'dialog' | 'confirm' | 'sheet' | 'toast';

interface OverlayEntry {
  id: string;
  type: OverlayType;
}

interface OverlayStackAPI {
  register: (id: string, type: OverlayType) => void;
  unregister: (id: string) => void;
  subscribe: (cb: () => void) => () => void;
  getStack: () => OverlayEntry[];
}

const OverlayStackCtx = createContext<OverlayStackAPI | null>(null);

const BASE_Z_INDEX = 50;

export const OverlayStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stackRef = useRef<OverlayEntry[]>([]);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const api = useMemo<OverlayStackAPI>(() => {
    const notify = () => {
      listenersRef.current.forEach(cb => cb());
    };
    return {
      register: (id, type) => {
        if (stackRef.current.some(e => e.id === id)) return;
        stackRef.current = [...stackRef.current, { id, type }];
        notify();
      },
      unregister: (id) => {
        const before = stackRef.current.length;
        stackRef.current = stackRef.current.filter(e => e.id !== id);
        if (before !== stackRef.current.length) notify();
      },
      subscribe: (cb) => {
        listenersRef.current.add(cb);
        return () => {
          listenersRef.current.delete(cb);
        };
      },
      getStack: () => stackRef.current,
    };
  }, []);

  return <OverlayStackCtx.Provider value={api}>{children}</OverlayStackCtx.Provider>;
};

/**
 * Register an overlay in the shared stack and receive a stack-aware
 * z-index plus a flag indicating whether this overlay is currently the
 * topmost. The flag is the right gate for global keyboard handlers
 * (Escape) and body scroll lock teardown.
 *
 * When the surrounding provider is absent (e.g. isolated component
 * tests), the hook degrades gracefully: z-index falls back to BASE and
 * isTopmost stays true so behavior matches the legacy "static z-50".
 */
export function useOverlay(
  type: OverlayType,
  open: boolean,
): { zIndex: number; isTopmost: boolean } {
  const ctx = useContext(OverlayStackCtx);
  const id = useId();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(() => setTick(t => t + 1));
  }, [ctx]);

  useEffect(() => {
    if (!ctx || !open) return;
    ctx.register(id, type);
    return () => ctx.unregister(id);
  }, [ctx, open, type, id]);

  if (!ctx || !open) {
    return { zIndex: BASE_Z_INDEX, isTopmost: true };
  }

  const stack = ctx.getStack();
  const depth = stack.findIndex(e => e.id === id);
  const isTopmost = depth >= 0 && depth === stack.length - 1;
  const zIndex = BASE_Z_INDEX + Math.max(depth, 0);

  return { zIndex, isTopmost };
}
