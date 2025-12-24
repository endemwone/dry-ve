import { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    isLoading?: boolean;
    icon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
    className,
    variant = 'primary',
    isLoading,
    icon,
    children,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-900/20 py-3 px-4",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 px-4",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white py-2 px-3"
    };

    return (
        <button
            className={twMerge(clsx(baseStyles, variants[variant], className))}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {children}
                </span>
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </button>
    );
};
