import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOverlay } from './OverlayStack';
import { StatusProgressBar } from './StatusProgressBar';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  progress?: number; // 0-100, undefined means indeterminate
  steps?: { label: string; status: 'pending' | 'active' | 'done' | 'error'; showProgress?: boolean }[];
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  subMessage,
  progress,
  steps,
}) => {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t('common.loading');
  const resolvedSubMessage = subMessage ?? t('ui.loading.pleaseWait');
  const { zIndex } = useOverlay('loading', isLoading);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl flex flex-col items-center max-w-md mx-4 w-full">
        {/* A determinate percentage is more informative than a spinner, so the
            spinner only appears when there is no progress figure to show. */}
        {progress === undefined && (
          <div className="p-2 md:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg
              className="h-12 w-12 md:h-16 md:w-16 text-yellow-600 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Messages */}
        <p className={`text-lg font-semibold text-foreground text-center ${progress === undefined ? 'mt-6' : ''}`}>
          {resolvedMessage}
        </p>
        {resolvedSubMessage && (
          <p className="text-sm text-muted-foreground mt-2 text-center">{resolvedSubMessage}</p>
        )}

        {/* Overall progress */}
        {progress !== undefined && (
          <div className="w-full mt-5">
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="relative bg-primary h-2.5 rounded-full overflow-hidden transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              >
                {progress < 100 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer motion-reduce:hidden" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 text-center tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Steps — each gets its own bar, so parallel work is visible as
            several bars moving at once rather than one spinner at a time. */}
        {steps && steps.length > 0 && (
          <div className="w-full mt-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className="space-y-1 animate-step-in motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(i * 45, 400)}ms` }}
              >
                <div className="flex items-center gap-2 text-sm">
                  {step.status === 'done' && (
                    <span className="text-emerald-500 flex-shrink-0">&#10003;</span>
                  )}
                  {step.status === 'error' && (
                    <span className="text-rose-500 flex-shrink-0">&#10007;</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="text-muted-foreground/40 flex-shrink-0">&#9675;</span>
                  )}
                  {step.status === 'active' && (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  )}
                  <span className={`truncate ${
                    step.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' :
                      step.status === 'active' ? 'text-foreground font-medium' :
                        step.status === 'error' ? 'text-rose-500' :
                          'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {step.showProgress && <StatusProgressBar status={step.status} showLabel />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
