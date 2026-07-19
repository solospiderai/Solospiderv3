'use client';

import React, { useEffect } from 'react';

interface DemoBookingButtonProps {
  /**
   * The direct Calendly event URL (e.g., "https://calendly.com/your-name/20-min-demo").
   * Defaults to NEXT_PUBLIC_CALENDLY_DEMO_URL env variable if provided.
   */
  calendlyUrl?: string;
  /** Custom text for the button */
  buttonText?: string;
  /** Extra CSS classes for custom styling */
  className?: string;
  /** Optional click event handler before opening modal */
  onClick?: () => void;
  /** Optional icon display */
  showIcon?: boolean;
}

export function DemoBookingButton({
  calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_DEMO_URL || 'https://calendly.com/solospider-info/30min',
  buttonText = 'Book a 20 Min Demo',
  className = '',
  onClick,
  showIcon = true,
}: DemoBookingButtonProps) {

  // Load Calendly CSS & JS dynamically on component mount
  useEffect(() => {
    // Inject CSS
    const cssId = 'calendly-widget-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    // Inject JS
    const jsId = 'calendly-widget-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) onClick();

    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({
        url: calendlyUrl,
      });
    } else {
      // Fallback: Open URL in new tab if script hasn't loaded yet
      window.open(calendlyUrl, '_blank');
    }
  };

  const defaultClasses =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ? `${defaultClasses} ${className}` : defaultClasses}
    >
      {showIcon && (
        <svg
          className="w-4 h-4 text-white/90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
      <span>{buttonText}</span>
    </button>
  );
}

export default DemoBookingButton;
