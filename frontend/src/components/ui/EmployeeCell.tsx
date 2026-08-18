import { useState } from 'react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

interface EmployeeCellProps {
    employeeId: number;
    name?: string | null;
    code?: string | null;
    /** Show an enlarged photo pinned to the viewport while the avatar is hovered. */
    hoverPreview?: boolean;
}

/**
 * Photo + name + code identity cell, matching the Daily Attendance table style.
 * Falls back to an initials avatar when the photo is missing or fails to load.
 */
export function EmployeeCell({ employeeId, name, code, hoverPreview = false }: EmployeeCellProps) {
    const [failed, setFailed] = useState(false);
    const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
    const label = name || `#${employeeId}`;
    const initials = label.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    const photoUrl = `${API_BASE_URL}/employees/${employeeId}/photo`;

    const showPreview = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!hoverPreview) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setPreview({ x: rect.left, y: rect.bottom + 4 });
    };

    return (
        <div className="flex items-center gap-2">
            {failed ? (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-xs">{initials}</span>
                </div>
            ) : (
                <img
                    src={photoUrl}
                    alt={label}
                    className={`flex-shrink-0 h-8 w-8 rounded-full object-cover ${hoverPreview ? 'cursor-pointer' : ''}`}
                    onError={() => setFailed(true)}
                    onMouseEnter={showPreview}
                    onMouseLeave={() => setPreview(null)}
                />
            )}
            <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{label}</div>
                {code && <div className="text-xs text-muted-foreground">{code}</div>}
            </div>
            {preview && (
                <div className="fixed z-[9999] pointer-events-none" style={{ left: preview.x, top: preview.y }}>
                    <img
                        src={photoUrl}
                        alt={label}
                        className="w-48 h-48 rounded-lg object-cover border-2 border-border shadow-xl bg-background"
                    />
                </div>
            )}
        </div>
    );
}
