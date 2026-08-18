import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon as Calendar } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

/**
 * DateInput — text input displaying DD/MM/YYYY with auto-mask,
 * emitting a YYYY-MM-DD value via the standard onChange(e) shape so it's
 * a drop-in replacement for <input type="date" name=... value=... onChange=...>.
 *
 * Users can type digits (slashes are inserted automatically) OR click the
 * calendar icon to pick from the native date picker.
 */

interface DateInputProps {
    name: string;
    value: string;                    // YYYY-MM-DD (or '')
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    placeholder?: string;
    id?: string;
}

function isoToDisplay(iso: string): string {
    if (!iso) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
}

function displayToIso(display: string): string | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    const d = Number(dd);
    const mo = Number(mm);
    const y = Number(yyyy);
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    if (y < 1900 || y > 2200) return null;
    // Validate via Date
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${yyyy}-${mm}-${dd}`;
}

function maskInput(raw: string): string {
    // Keep only digits, cap to 8
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export const DateInput: React.FC<DateInputProps> = ({
    name,
    value,
    onChange,
    disabled,
    required,
    className,
    placeholder = 'DD/MM/YYYY',
    id,
}) => {
    const { t } = useTranslation();
    const [display, setDisplay] = useState<string>(() => isoToDisplay(value));
    const pickerRef = useRef<HTMLInputElement>(null);

    // Keep display synced when parent updates value externally (e.g. editing load)
    useEffect(() => {
        setDisplay(isoToDisplay(value));
    }, [value]);

    const emit = (iso: string) => {
        onChange({ target: { name, value: iso } } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskInput(e.target.value);
        setDisplay(masked);

        if (masked === '') {
            emit('');
            return;
        }
        const iso = displayToIso(masked);
        if (iso) {
            emit(iso);
        }
        // Don't emit while partial — keep old value until complete & valid
    };

    const handleBlur = () => {
        if (display === '') return;
        // Revert display if invalid to last good ISO
        if (!displayToIso(display)) {
            setDisplay(isoToDisplay(value));
        }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value; // native gives YYYY-MM-DD
        setDisplay(isoToDisplay(iso));
        emit(iso);
    };

    const openPicker = () => {
        if (disabled) return;
        const el = pickerRef.current;
        if (!el) return;
        // Prefer showPicker where supported (Chrome/Edge); fallback to click
        const anyEl = el as HTMLInputElement & { showPicker?: () => void };
        if (typeof anyEl.showPicker === 'function') {
            try { anyEl.showPicker(); return; } catch { /* fall through */ }
        }
        el.click();
    };

    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                inputMode="numeric"
                name={name}
                value={display}
                onChange={handleTextChange}
                onBlur={handleBlur}
                disabled={disabled}
                required={required}
                placeholder={placeholder}
                autoComplete="off"
                className={cn(
                    'w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
            />
            <button
                type="button"
                onClick={openPicker}
                disabled={disabled}
                aria-label={t('ui.dateInput.openPicker')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Calendar className="size-4" />
            </button>
            <input
                ref={pickerRef}
                type="date"
                value={value || ''}
                onChange={handlePickerChange}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
            />
        </div>
    );
};

export default DateInput;
