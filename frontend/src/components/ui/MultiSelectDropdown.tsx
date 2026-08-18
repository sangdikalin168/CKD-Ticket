import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon as Check, ChevronDownIcon as ChevronDown, XMarkIcon as X } from "@heroicons/react/24/outline";

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    /** Max height of the dropdown list in px */
    maxHeight?: number;
    /** Show search input when option count exceeds this (default: 8) */
    searchThreshold?: number;
    /** Forwarded to the trigger button so a `<label htmlFor>` can target it */
    id?: string;
    /** Text shown when every option is selected (defaults to the placeholder — filter semantics) */
    allSelectedLabel?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    options,
    selected,
    onChange,
    placeholder,
    className = "",
    maxHeight = 360,
    searchThreshold = 8,
    id,
    allSelectedLabel,
}) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder ?? t("common.all");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close on outside click — use pointerdown for reliable detection
    useEffect(() => {
        if (!open) return;
        const handler = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("pointerdown", handler);
        return () => document.removeEventListener("pointerdown", handler);
    }, [open]);

    // Focus search when opening
    useEffect(() => {
        if (open && options.length >= searchThreshold) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [open, options.length, searchThreshold]);

    const toggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectAll = () => {
        onChange(options.map((o) => o.value));
    };

    const filtered = search
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Display text
    const displayText =
        selected.length === 0
            ? resolvedPlaceholder
            : selected.length === 1
                ? options.find((o) => o.value === selected[0])?.label || selected[0]
                : selected.length === options.length
                    ? (allSelectedLabel ?? resolvedPlaceholder)
                    : t("ui.multiSelect.selectedCount", { count: selected.length });

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                id={id}
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background hover:border-ring/60 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
                    {selected.length > 0 && selected.length < options.length && (
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold tabular-nums shrink-0">
                            {selected.length}
                        </span>
                    )}
                    <span className={`truncate ${selected.length === 0 ? "text-muted-foreground" : "font-medium"}`}>
                        {displayText}
                    </span>
                </span>
                <span className="flex items-center gap-1 ml-2 shrink-0">
                    {selected.length > 0 && selected.length < options.length && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={clearAll}
                            aria-label={t("ui.select.clearSelection")}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute z-50 mt-1.5 w-full min-w-[260px] rounded-xl border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95"
                >
                    {/* Search */}
                    {options.length >= searchThreshold && (
                        <div className="p-2 border-b border-border">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t("common.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    )}

                    {/* Select All / Clear All */}
                    {!search && (
                        <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-border bg-muted/30">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={selectAll}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                            >
                                {t("common.selectAll")}
                            </button>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {selected.length} / {options.length}
                            </span>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onChange([])}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                {t("ui.multiSelect.clearAll")}
                            </button>
                        </div>
                    )}

                    {/* Options */}
                    <div className="overflow-y-auto py-1" style={{ maxHeight }}>
                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-muted-foreground text-center">{t("ui.select.noResultsShort")}</div>
                        ) : (
                            filtered.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggle(option.value)}
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-primary/10 text-foreground font-medium hover:bg-primary/15"
                                                : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                isSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-input bg-background"
                                            }`}
                                        >
                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                        <span className="truncate text-left flex-1">{option.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
