import { useEffect, useState } from 'react';

export function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => (
    typeof window === 'undefined' ? false : window.innerWidth < breakpointPx
  ));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpointPx);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpointPx]);

  return isMobile;
}
