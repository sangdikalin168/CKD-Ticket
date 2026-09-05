import { useState } from 'react';
import { BuildingOffice2Icon as Building2 } from '@heroicons/react/24/outline';

export type CompanyLogoSize = 'sm' | 'md' | 'lg' | 'auto' | number;

export interface CompanyLogoProps {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: CompanyLogoSize;
  className?: string;
  fallback?: 'icon' | 'none';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

function boxStyle(size: CompanyLogoSize): { className: string; style?: React.CSSProperties } {
  if (typeof size === 'number') {
    return { className: '', style: { height: size, width: size } };
  }
  // 'auto' hands sizing entirely to `className` — used where the box isn't a
  // fixed square (e.g. a max-height/max-width logo that keeps its own aspect ratio).
  if (size === 'auto') return { className: '' };
  return { className: SIZE_CLASSES[size] };
}

/**
 * Company/site logo with a Building2 fallback on missing src or load error.
 * fallback='none' renders nothing (no box, no icon) when there is no image —
 * used by contexts like the report mirror that must match a "no logo" render.
 */
export function CompanyLogo({ src, name, alt, size = 'md', className = '', fallback = 'icon' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  if (!showImage && fallback === 'none') return null;

  const { className: sizeClassName, style } = boxStyle(size);

  if (!showImage) {
    return (
      <div
        className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md
 border border-border bg-muted ${sizeClassName} ${className}`}
        style={style}
      >
        <Building2 className="h-1/2 w-1/2 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? (name ? `${name} logo` : 'logo')}
      className={`object-contain ${sizeClassName} ${className}`}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

export default CompanyLogo;
