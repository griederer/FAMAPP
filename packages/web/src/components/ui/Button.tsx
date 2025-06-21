// Reusable Button component with design system
import { forwardRef } from 'react';
import { buttonStyles } from '../../styles/components';
import { cn } from '../../styles/components';
import type { ButtonProps } from '../../types/theme';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled, loading, children, className, type = 'button', onClick, title, 'aria-label': ariaLabel }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={cn(
          buttonStyles.base,
          buttonStyles.variants[variant],
          buttonStyles.sizes[size],
          className
        )}
      >
        {loading && (
          <div className="loading-spinner mr-2" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';