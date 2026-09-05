import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useOverlay } from './OverlayStack';
import { StatusProgressBar } from './StatusProgressBar';
import { StateDot } from './Chip';

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex }}
    >
      <div className="bg-card border border-rule rounded-lg p-8 shadow-overlay flex flex-col items-center max-w-md mx-4 w-full">
        {/* A determinate percentage is more informative than a spinner, so the
            spinner only appears when there is no progress figure to show. */}
        {progress === undefined && (
          <Loader2 className="h-10 w-10 text-ink animate-spin" aria-hidden="true" />
        )}

        {/* Messages */}
        <p className={`text-lg font-semibold text-ink text-center ${progress === undefined ? 'mt-5' : ''}`}>
          {resolvedMessage}
        </p>
        {resolvedSubMessage && (
          <p className="text-sm text-ink-soft mt-2 text-center">{resolvedSubMessage}</p>
        )}

        {/* Overall progress */}
        {progress !== undefined && (
          <div className="w-full mt-5">
            <div className="w-full bg-wash rounded-full h-2.5 overflow-hidden">
              <div
                className="relative bg-ink h-2.5 rounded-full overflow-hidden transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              >
                {progress < 100 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer motion-reduce:hidden" />
                )}
              </div>
            </div>
            <p className="text-xs text-ink-soft mt-1.5 text-center tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Steps — each gets its own bar, so parallel work is visible as
            several bars moving at once rather than one spinner at a time. */}
        {steps && steps.length > 0 && (
          <div className="w-full mt-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
            {steps.map((step, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <StateDot
                    tone={
                      step.status === 'done' ? 'paid'
                        : step.status === 'error' ? 'void'
                          : step.status === 'active' ? 'notice'
                            : 'muted'
                    }
                  />
                  <span className={`truncate ${
 step.status === 'active' ? 'text-ink font-medium' :
                      step.status === 'pending' ? 'text-ink-soft' :
                        'text-ink'
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
