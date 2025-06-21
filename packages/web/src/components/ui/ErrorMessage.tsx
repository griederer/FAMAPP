// Error message component for displaying inline errors
import { cn } from '../../styles/components';
import { useI18n } from '../../hooks';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  variant?: 'inline' | 'card' | 'banner';
  severity?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  dismissable?: boolean;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
}

export const ErrorMessage = ({
  title,
  message,
  variant = 'inline',
  severity = 'error',
  showIcon = true,
  dismissable = false,
  onDismiss,
  actions,
  className
}: ErrorMessageProps) => {
  const { t } = useI18n();

  const severityStyles = {
    error: {
      container: 'bg-error-50 border-error-200 text-error-800',
      icon: 'text-error-600',
      title: 'text-error-900',
      button: 'text-error-600 hover:text-error-800'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: 'text-warning-600',
      title: 'text-warning-900', 
      button: 'text-warning-600 hover:text-warning-800'
    },
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-800',
      icon: 'text-primary-600',
      title: 'text-primary-900',
      button: 'text-primary-600 hover:text-primary-800'
    }
  };

  const styles = severityStyles[severity];

  const getIcon = () => {
    if (!showIcon) return null;

    const iconClass = cn('flex-shrink-0', styles.icon);

    if (severity === 'error') {
      return (
        <svg className={cn(iconClass, 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    if (severity === 'warning') {
      return (
        <svg className={cn(iconClass, 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <svg className={cn(iconClass, 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const baseClasses = cn(
    'border rounded-xl',
    styles.container
  );

  const variantClasses = {
    inline: 'p-3',
    card: 'p-4 shadow-sm',
    banner: 'p-4 rounded-none border-x-0'
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('text-sm font-medium mb-1', styles.title)}>
              {title}
            </h3>
          )}
          
          {message && (
            <p className="text-sm">
              {message}
            </p>
          )}

          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200',
                    action.variant === 'primary' 
                      ? 'bg-white shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : styles.button
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {dismissable && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-lg transition-colors duration-200',
              styles.button
            )}
            aria-label={t('common.dismiss')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};