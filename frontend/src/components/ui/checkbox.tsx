import React from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Labelled checkbox. The whole row is the hit target, so it stays usable at
 * touch sizes without the caller wiring up its own <label>.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => (
  <label
    className={cn(
      'flex items-start gap-3 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
      className,
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
    />
    <span className="min-w-0">
      <span className="block text-sm text-foreground">{label}</span>
      {description && (
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      )}
    </span>
  </label>
);
