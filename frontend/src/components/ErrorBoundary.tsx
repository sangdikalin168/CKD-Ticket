import { Component, ErrorInfo, ReactNode } from 'react';
import i18next from 'i18next';

const RELOAD_GUARD_KEY = 'errorBoundaryAutoReloadAt';
const RELOAD_GUARD_WINDOW_MS = 10_000;

/**
 * True when the error smells like a stale-bundle / dynamic-import failure —
 * e.g. a new build replaced the chunks while the page was open. (Mostly
 * future-proofing: today the app ships as eager bundles with no runtime
 * `import()`, so this rarely fires — but it's cheap insurance.)
 */
function isChunkLoadError(err: unknown): boolean {
    const text = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '');
    return /ChunkLoadError|Loading chunk \S+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(text);
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * App-wide error boundary. Without this, any uncaught render error blanks the
 * whole page. Here we show a friendly fallback with a Reload button — and if
 * the error looks like a stale-bundle problem we attempt a single automatic
 * hard reload to pick up the fresh build (guarded against reload loops).
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);

        if (isChunkLoadError(error)) {
            try {
                const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
                if (Date.now() - last > RELOAD_GUARD_WINDOW_MS) {
                    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
                    window.location.reload();
                }
            } catch {
                // sessionStorage unavailable (private mode etc.) — fall through to the fallback UI
            }
        }
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (!this.state.error) return this.props.children;

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
                <div className="text-lg font-semibold">{i18next.t('errors.somethingWentWrong')}</div>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {i18next.t('errors.unexpectedError')}
                </p>
                <button
                    type="button"
                    onClick={this.handleReload}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                    {i18next.t('errors.reloadPage')}
                </button>
            </div>
        );
    }
}
