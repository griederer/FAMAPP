// Loading state component for full-page and section loading
import { cn } from '../../styles/components';
import { LoadingSpinner } from './LoadingSpinner';
import { useI18n } from '../../hooks';

interface LoadingStateProps {
  variant?: 'page' | 'section' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showMessage?: boolean;
  skeleton?: boolean;
  className?: string;
}

export const LoadingState = ({
  variant = 'section',
  size = 'md',
  message,
  showMessage = true,
  skeleton = false,
  className
}: LoadingStateProps) => {
  const { t } = useI18n();

  const defaultMessage = message || t('common.loading');

  if (skeleton) {
    return <SkeletonLoader variant={variant} className={className} />;
  }

  const containerClasses = {
    page: 'min-h-screen flex items-center justify-center p-6',
    section: 'min-h-[200px] flex items-center justify-center p-6',
    overlay: 'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
  };

  const spinnerSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  };

  return (
    <div 
      className={cn(containerClasses[variant], className)}
      role="status"
      aria-label={defaultMessage}
    >
      <div className="text-center">
        <LoadingSpinner 
          size={spinnerSizes[size]} 
          color="primary"
          className="mx-auto mb-3"
        />
        {showMessage && (
          <p className="text-sm text-gray-600 font-medium">
            {defaultMessage}
          </p>
        )}
      </div>
    </div>
  );
};

interface SkeletonLoaderProps {
  variant?: 'page' | 'section' | 'overlay';
  className?: string;
}

const SkeletonLoader = ({ variant = 'section', className }: SkeletonLoaderProps) => {
  const containerClasses = {
    page: 'min-h-screen p-6',
    section: 'min-h-[200px] p-6',
    overlay: 'absolute inset-0 bg-white p-6 z-50'
  };

  return (
    <div className={cn(containerClasses[variant], className)}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};