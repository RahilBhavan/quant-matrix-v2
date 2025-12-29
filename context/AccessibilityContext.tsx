/**
 * AccessibilityContext - Global Accessibility State Management
 *
 * Features:
 * - Reduce Motion preference (system + user toggle)
 * - High Contrast mode toggle
 * - Persists preferences to localStorage
 * - Provides CSS class helpers for conditional styling
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';

interface AccessibilityState {
    reduceMotion: boolean;
    highContrast: boolean;
}

interface AccessibilityContextValue extends AccessibilityState {
    toggleReduceMotion: () => void;
    toggleHighContrast: () => void;
    setReduceMotion: (value: boolean) => void;
    setHighContrast: (value: boolean) => void;
}

const STORAGE_KEY = 'qm-accessibility-prefs';

const defaultState: AccessibilityState = {
    reduceMotion: false,
    highContrast: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Hook to access accessibility context
 */
export const useAccessibility = (): AccessibilityContextValue => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};

/**
 * Safe hook that returns defaults when outside provider
 */
export const useAccessibilitySafe = (): AccessibilityContextValue => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        return {
            ...defaultState,
            toggleReduceMotion: () => { },
            toggleHighContrast: () => { },
            setReduceMotion: () => { },
            setHighContrast: () => { },
        };
    }
    return context;
};

interface AccessibilityProviderProps {
    children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
    children,
}) => {
    const [state, setState] = useState<AccessibilityState>(defaultState);

    // Load saved preferences and system preferences on mount
    useEffect(() => {
        // Check system preference for reduced motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const systemPrefersReducedMotion = mediaQuery.matches;

        // Load saved preferences
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Partial<AccessibilityState>;
                setState({
                    reduceMotion: parsed.reduceMotion ?? systemPrefersReducedMotion,
                    highContrast: parsed.highContrast ?? false,
                });
            } else {
                // Use system preference as default
                setState((prev) => ({
                    ...prev,
                    reduceMotion: systemPrefersReducedMotion,
                }));
            }
        } catch (error) {
            console.warn('[Accessibility] Failed to load preferences:', error);
            setState((prev) => ({
                ...prev,
                reduceMotion: systemPrefersReducedMotion,
            }));
        }

        // Listen for system preference changes
        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if user hasn't explicitly set a preference
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                setState((prev) => ({ ...prev, reduceMotion: e.matches }));
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Save preferences when they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('[Accessibility] Failed to save preferences:', error);
        }
    }, [state]);

    // Apply CSS classes to document root
    useEffect(() => {
        const root = document.documentElement;

        if (state.reduceMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }

        if (state.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
    }, [state]);

    const toggleReduceMotion = useCallback(() => {
        setState((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }));
    }, []);

    const toggleHighContrast = useCallback(() => {
        setState((prev) => ({ ...prev, highContrast: !prev.highContrast }));
    }, []);

    const setReduceMotion = useCallback((value: boolean) => {
        setState((prev) => ({ ...prev, reduceMotion: value }));
    }, []);

    const setHighContrast = useCallback((value: boolean) => {
        setState((prev) => ({ ...prev, highContrast: value }));
    }, []);

    const value: AccessibilityContextValue = {
        ...state,
        toggleReduceMotion,
        toggleHighContrast,
        setReduceMotion,
        setHighContrast,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export default AccessibilityProvider;
