import { HTMLAttributes, FC } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outlined' | 'interactive';
    isSelected?: boolean;
}

export const Card: FC<CardProps> = ({ className, variant = 'default', isSelected, children, ...props }) => {
    const baseStyles = "rounded-2xl transition-all";

    const variants = {
        default: "bg-slate-800 shadow-xl border border-slate-700",
        outlined: "bg-transparent border border-slate-700",
        interactive: clsx(
            "cursor-pointer border-2",
            isSelected
                ? "bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10"
                : "bg-slate-800 border-transparent hover:border-slate-600"
        )
    };

    return (
        <div
            className={twMerge(clsx(baseStyles, variants[variant], className))}
            {...props}
        >
            {children}
        </div>
    );
};
