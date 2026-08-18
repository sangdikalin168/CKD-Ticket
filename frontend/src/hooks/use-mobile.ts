import * as React from 'react';

// Matches the app's existing sidebar drawer breakpoint (Tailwind `lg`): below
// this the sidebar is an overlay sheet, at/above it docks as an offcanvas panel.
const MOBILE_BREAKPOINT = 1024;

/** True when the viewport is narrower than the mobile breakpoint (1024px). */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
