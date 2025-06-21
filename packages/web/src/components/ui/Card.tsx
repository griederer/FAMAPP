// Reusable Card component with design system
import { forwardRef } from 'react';
import { cardStyles } from '../../styles/components';
import { cn } from '../../styles/components';
import type { CardProps } from '../../types/theme';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', children, className, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          cardStyles.base,
          cardStyles.variants[variant],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(cardStyles.sections.header, className)}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(cardStyles.sections.content, className)}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(cardStyles.sections.footer, className)}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export const CardTitle = forwardRef<HTMLHeadingElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600', className)}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';