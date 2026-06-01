import { useEffect, useState } from 'react';
import type React from 'react';

export const useDocumentVisible = (): boolean => {
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof document === 'undefined') return true;
        return !document.hidden;
    });

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const updateVisibility = () => setIsVisible(!document.hidden);
        updateVisibility();
        document.addEventListener('visibilitychange', updateVisibility);

        return () => {
            document.removeEventListener('visibilitychange', updateVisibility);
        };
    }, []);

    return isVisible;
};

export const useOnscreen = <T extends Element>(
    ref: React.RefObject<T | null>,
    rootMargin = '0px',
): boolean => {
    const [isOnscreen, setIsOnscreen] = useState(true);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setIsOnscreen(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            setIsOnscreen(entry.isIntersecting || entry.intersectionRatio > 0);
        }, { rootMargin, threshold: 0 });

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [ref, rootMargin]);

    return isOnscreen;
};
