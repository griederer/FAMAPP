// Loading spinner component with multiple variants
import { cn } from '../../styles/components';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'spinner',
  color = 'primary',
  className 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600', 
    white: 'text-white',
    gray: 'text-gray-600',
  };

  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'dots') {
    const dotSize = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5', 
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
      xl: 'w-3 h-3',
    };

    return (
      <div 
        className={cn('flex space-x-1', className)}
        role="status"
        aria-label="Loading"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              dotSize[size],
              colorClasses[color] === 'text-white' ? 'bg-white' : 
              colorClasses[color] === 'text-gray-600' ? 'bg-gray-600' :
              colorClasses[color] === 'text-secondary-600' ? 'bg-secondary-600' : 'bg-primary-600'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color] === 'text-white' ? 'bg-white' : 
          colorClasses[color] === 'text-gray-600' ? 'bg-gray-600' :
          colorClasses[color] === 'text-secondary-600' ? 'bg-secondary-600' : 'bg-primary-600',
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'bars') {
    const barHeight = {
      xs: 'h-2',
      sm: 'h-3',
      md: 'h-4', 
      lg: 'h-5',
      xl: 'h-6',
    };

    return (
      <div 
        className={cn('flex items-end space-x-1', className)}
        role="status"
        aria-label="Loading"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-1 animate-pulse rounded-sm',
              barHeight[size],
              colorClasses[color] === 'text-white' ? 'bg-white' : 
              colorClasses[color] === 'text-gray-600' ? 'bg-gray-600' :
              colorClasses[color] === 'text-secondary-600' ? 'bg-secondary-600' : 'bg-primary-600'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return null;
};