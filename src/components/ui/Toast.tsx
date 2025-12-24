/**
 * Toast Component
 * 
 * A notification component that displays success or error messages.
 * Auto-dismisses after 4 seconds with a fade-out animation.
 */

import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ToastProps {
    /** Message to display */
    message: string;
    /** Visual style: success (green) or error (red) */
    type: 'success' | 'error';
    /** Callback when toast is dismissed */
    onClose: () => void;
}

/** Auto-dismiss delay in milliseconds */
const AUTO_DISMISS_MS = 4000;

/** Fade-out animation duration in milliseconds */
const FADE_DURATION_MS = 300;

export default function Toast({ message, type, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for fade animation before removing
            setTimeout(onClose, FADE_DURATION_MS);
        }, AUTO_DISMISS_MS);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90';
    const Icon = type === 'error' ? AlertCircle : CheckCircle;

    return (
        <div
            role="alert"
            className={`
                fixed bottom-4 right-4 z-50 
                flex items-center gap-3 px-4 py-3 
                rounded-lg shadow-lg backdrop-blur-sm text-white 
                transition-all duration-300 
                ${bgColor} 
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
        >
            <Icon size={20} />
            <span className="font-medium">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 hover:opacity-70 transition-opacity"
                aria-label="Dismiss notification"
            >
                <X size={18} />
            </button>
        </div>
    );
}
