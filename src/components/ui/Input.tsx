/**
 * Input Component
 * 
 * A styled text input with optional label.
 * Extends native input attributes.
 */

import { InputHTMLAttributes, FC } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Label text displayed above the input */
    label?: string;
}

const inputStyles = `
    w-full bg-slate-900 
    border border-slate-700 rounded-lg 
    p-3 text-slate-300 
    placeholder:text-slate-600 
    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
    disabled:opacity-70 disabled:cursor-not-allowed 
    transition-colors
`;

export const Input: FC<InputProps> = ({ className, label, ...props }) => {
    return (
        <div className="relative">
            {label && (
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                className={twMerge(clsx(inputStyles, className))}
                {...props}
            />
        </div>
    );
};
