import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon as Search, XMarkIcon as X, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    /** Selected value; empty string means nothing selected */
    value: string;
    /** Called with the chosen value, or '' when cleared */
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    /** Show the clear (X) button when a value is selected (default true) */
    allowClear?: boolean;
    /** Show the search box only when option count reaches this (default 8) */
    searchThreshold?: number;
    disabled?: boolean;
    className?: string;
    /** Associates an external <label htmlFor> with the trigger */
    id?: string;
}

/**
 * Single-select dropdown with type-ahead filtering, mirroring the Employee
 * form's Supervisor combobox. Keyboard + click-outside friendly; the search
 * box auto-hides for short lists.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    allowClear = true,
    searchThreshold = 8,
    disabled = false,
    className = '',
    id,
}) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder ?? t('ui.select.placeholder');
    const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.searchPlaceholder');
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const autoId = useId();
    const listboxId = `${id || autoId}-listbox`;

    const selected = options.find((o) => o.value === value);
    const showSearch = options.length >= searchThreshold;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, search]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, [open]);

    // On open: focus the search box and highlight the current selection.
    useEffect(() => {
        if (!open) return;
        setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
        if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => setHighlight(0), [search]);

    useEffect(() => {
        if (!open || !listRef.current) return;
        (listRef.current.children[highlight] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }, [highlight, open]);

    const choose = (v: string) => {
        onChange(v);
        setOpen(false);
        setSearch('');
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (!open) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setSearch('');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const opt = filtered[highlight];
            if (opt) choose(opt.value);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className={`truncate text-left ${selected ? '' : 'text-muted-foreground'}`}>
                    {selected ? selected.label : resolvedPlaceholder}
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-1">
                    {allowClear && selected && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            aria-label={t('ui.select.clearSelection')}
                            onClick={clear}
                            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                    {showSearch && (
                        <div className="border-b border-border p-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={resolvedSearchPlaceholder}
                                    aria-label={resolvedSearchPlaceholder}
                                    className="w-full rounded border border-input bg-background py-1.5 pl-8 pr-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>
                    )}
                    <div ref={listRef} role="listbox" id={listboxId} className="max-h-60 overflow-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">{t('ui.select.noResults')}</div>
                        ) : (
                            filtered.map((opt, i) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={opt.value === value}
                                    onClick={() => choose(opt.value)}
                                    onMouseEnter={() => setHighlight(i)}
                                    className={`block w-full px-3 py-2 text-left text-sm transition-colors ${i === highlight ? 'bg-accent text-accent-foreground' : ''} ${opt.value === value ? 'font-medium' : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
