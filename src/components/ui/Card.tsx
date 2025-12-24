/**
 * Card Component
 * 
 * A container component with multiple variants.
 * Supports interactive mode for clickable cards.
 */

import { HTMLAttributes, FC } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual style variant */
    variant?: 'default' | 'outlined' | 'interactive';
    /** Highlight state for interactive variant */
    isSelected?: boolean;
}

const baseStyles = 'rounded-2xl transition-all';

const variantStyles = {
    default: 'bg-slate-800 shadow-xl border border-slate-700',
    outlined: 'bg-transparent border border-slate-700'
};

export const Card: FC<CardProps> = ({
    className,
    variant = 'default',
    isSelected,
    children,
    ...props
}) => {
    // Interactive variant has dynamic styles based on selection
    const interactiveStyles = clsx(
        'cursor-pointer border-2',
        isSelected
            ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10'
            : 'bg-slate-800 border-transparent hover:border-slate-600'
    );

    const styles = variant === 'interactive'
        ? interactiveStyles
        : variantStyles[variant];

    return (
        <div
            className={twMerge(clsx(baseStyles, styles, className))}
            {...props}
        >
            {children}
        </div>
    );
};
