import { Loader2 } from "lucide-react";

interface LoadingPageProps {
    message?: string;
}

/** Full-screen busy state: the page dims behind one floating panel. */
const LoadingPage = ({ message }: LoadingPageProps) => {
    return (
        <div className="overlay-content" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-rule bg-card px-10 py-8 shadow-overlay">
                <Loader2 className="h-8 w-8 animate-spin text-ink-soft" aria-hidden="true" />
                {message ? <p className="text-sm font-medium text-ink">{message}</p> : null}
            </div>
        </div>
    );
};

export default LoadingPage;
