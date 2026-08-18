import React from 'react';

export type SummaryCardTone = 'blue' | 'indigo' | 'green' | 'amber' | 'red' | 'slate';

export interface SummaryCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone: SummaryCardTone;
    /** Secondary line under the value, e.g. "3 due in 30 days". */
    hint?: string;
    /** Makes the whole card activate — use when there is a drill-down to open. */
    onClick?: () => void;
}

const TONE_CLASSES: Record<SummaryCardTone, string> = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, tone, hint, onClick }) => {
    const body = (
        <>
            <div className={`flex items-center justify-center h-11 w-11 rounded-lg shrink-0 ${TONE_CLASSES[tone]}`}>
                {icon}
            </div>
            <div className="min-w-0 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-semibold text-foreground mt-0.5 tabular-nums">{value}</p>
                {hint && <p className="text-xs text-muted-foreground mt-0.5 truncate">{hint}</p>}
            </div>
        </>
    );

    if (!onClick) {
        return <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">{body}</div>;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 w-full
                       hover:border-primary hover:bg-accent/40 focus:outline-none focus:ring-2
                       focus:ring-ring focus:ring-offset-2 transition-colors"
        >
            {body}
        </button>
    );
};
