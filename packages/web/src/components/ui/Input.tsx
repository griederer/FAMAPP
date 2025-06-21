// Reusable Input component with design system
import { forwardRef } from 'react';
import { inputStyles } from '../../styles/components';
import { cn } from '../../styles/components';
import type { InputProps } from '../../types/theme';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    size = 'md', 
    variant = 'default', 
    disabled, 
    placeholder, 
    value, 
    onChange, 
    className, 
    type = 'text',
    label,
    error,
    helperText,
    required,
    min,
    autoFocus,
    ...rest
  }, ref) => {
    const hasError = Boolean(error);
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          required={required}
          min={min}
          autoFocus={autoFocus}
          onChange={onChange}
          className={cn(
            inputStyles.base,
            inputStyles.sizes[size],
            inputStyles.variants[hasError ? 'error' : variant],
            className
          )}
          {...rest}
        />
        
        {error && (
          <p className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';