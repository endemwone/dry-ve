import { InputHTMLAttributes, FC } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: FC<InputProps> = ({ className, label, ...props }) => {
    return (
        <div className="relative">
            {label && (
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                className={twMerge(clsx(
                    "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors",
                    className
                ))}
                {...props}
            />
        </div>
    );
};
