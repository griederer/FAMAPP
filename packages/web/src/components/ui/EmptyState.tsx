// Empty state component for when there's no data to display
import { cn } from '../../styles/components';
import { useI18n } from '../../hooks';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  variant?: 'default' | 'minimal' | 'illustration';
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className
}: EmptyStateProps) => {
  const { t } = useI18n();

  const defaultIcon = (
    <svg 
      className="w-12 h-12 text-gray-400" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
      />
    </svg>
  );

  const variantClasses = {
    default: 'min-h-[300px] flex items-center justify-center p-8',
    minimal: 'min-h-[200px] flex items-center justify-center p-6',
    illustration: 'min-h-[400px] flex items-center justify-center p-12'
  };

  const iconSize = {
    default: 'w-12 h-12',
    minimal: 'w-8 h-8', 
    illustration: 'w-16 h-16'
  };

  return (
    <div 
      className={cn(variantClasses[variant], className)}
      role="status"
      aria-label={title || t('common.empty_state')}
    >
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {variant === 'illustration' ? (
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              {icon ? (
                <div className="text-gray-400">
                  {icon}
                </div>
              ) : (
                defaultIcon
              )}
            </div>
          ) : (
            <div className={cn('text-gray-400', iconSize[variant])}>
              {icon || defaultIcon}
            </div>
          )}
        </div>

        {/* Title */}
        {title && (
          <h3 className={cn(
            'font-semibold text-gray-900 mb-2',
            variant === 'minimal' ? 'text-base' : 'text-lg'
          )}>
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p className={cn(
            'text-gray-600 mb-6',
            variant === 'minimal' ? 'text-sm' : 'text-base'
          )}>
            {description}
          </p>
        )}

        {/* Action button */}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'px-4 py-2 rounded-xl font-medium transition-colors duration-200',
              action.variant === 'secondary'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-primary-600 text-white hover:bg-primary-700',
              variant === 'minimal' ? 'text-sm px-3 py-1.5' : 'text-base'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};