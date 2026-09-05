import { Loader2 } from "lucide-react";

interface LoadingPageProps {
    message?: string;
}

/** Full-screen busy state: the board dims, a magnet spins, the message beneath. */
const LoadingPage = ({ message }: LoadingPageProps) => {
    return (
        <div className="overlay-content" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-rule bg-card px-10 py-8 shadow-overlay">
                <Loader2 className="h-10 w-10 animate-spin text-ink" aria-hidden="true" />
                <div className="marker-rule w-12" />
                {message ? <p className="text-sm font-medium text-ink">{message}</p> : null}
            </div>
        </div>
    );
};

export default LoadingPage;
