'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Hook to get motion configuration that respects user's reduced motion preference.
 * Use this to conditionally disable animations for accessibility.
 * 
 * Usage:
 * const { shouldReduceMotion, motionProps } = useAccessibleMotion()
 * <motion.div {...motionProps({ initial: { opacity: 0 }, animate: { opacity: 1 } })}>
 */
export function useAccessibleMotion() {
    const shouldReduceMotion = useReducedMotion()

    /**
     * Returns motion props with reduced motion support.
     * When reduced motion is preferred, animations are disabled.
     */
    const motionProps = <T extends Record<string, unknown>>(props: T): T | Record<string, never> => {
        if (shouldReduceMotion) {
            // Return empty object to disable animations
            return {}
        }
        return props
    }

    /**
     * Returns transition with reduced motion support.
     * When reduced motion is preferred, returns instant transition.
     */
    const safeTransition = (transition: Record<string, unknown>) => {
        if (shouldReduceMotion) {
            return { duration: 0 }
        }
        return transition
    }

    return {
        shouldReduceMotion,
        motionProps,
        safeTransition,
    }
}

/**
 * Default animation variants that respect reduced motion.
 * Use with AnimatePresence and motion components.
 */
export const accessibleVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
}
