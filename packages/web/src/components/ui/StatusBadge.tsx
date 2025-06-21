// Status badge component
import { statusStyles } from '../../styles/components';
import { cn } from '../../styles/components';
import type { StatusBadgeProps } from '../../types/theme';

export const StatusBadge = ({ variant = 'neutral', children, className }: StatusBadgeProps) => {
  const variantMap = {
    primary: 'info',
    secondary: 'neutral',
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
    neutral: 'neutral',
  } as const;
  
  const mappedVariant = variant in variantMap ? variantMap[variant as keyof typeof variantMap] : 'neutral';
  
  return (
    <span
      className={cn(
        statusStyles.base,
        statusStyles.variants[mappedVariant as keyof typeof statusStyles.variants],
        className
      )}
    >
      {children}
    </span>
  );
};