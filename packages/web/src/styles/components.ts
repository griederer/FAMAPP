// Component style utilities for FAMAPP
// Reusable style patterns and component variants

// Button variants
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  
  variants: {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500',
  },
  
  sizes: {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },
};

// Input styles
export const inputStyles = {
  base: 'flex w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  
  sizes: {
    xs: 'h-7 px-2 py-1 text-xs',
    sm: 'h-8 px-2 py-1 text-xs',
    md: 'h-10 px-3 py-2 text-sm',
    lg: 'h-12 px-4 py-3 text-base',
  },
  
  variants: {
    default: '',
    error: 'border-error-300 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
  },
};

// Card styles
export const cardStyles = {
  base: 'rounded-2xl border border-gray-200 bg-white shadow-soft',
  
  variants: {
    default: '',
    elevated: 'shadow-medium',
    interactive: 'hover:shadow-medium transition-shadow duration-200 cursor-pointer',
  },
  
  sections: {
    header: 'flex flex-col space-y-1.5 p-6 pb-3',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
};

// Family member tag styles
export const familyTagStyles = {
  base: 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
  
  // Dynamic colors based on family member
  getVariant: (member: string) => {
    const colorMap: Record<string, string> = {
      gonzalo: 'bg-primary-100 text-primary-800 border border-primary-200',
      mpaz: 'bg-success-100 text-success-800 border border-success-200',
      borja: 'bg-warning-100 text-warning-800 border border-warning-200',
      melody: 'bg-error-100 text-error-800 border border-error-200',
    };
    return colorMap[member.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
  },
};

// Loading states
export const loadingStyles = {
  spinner: 'inline-block w-4 h-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  
  skeleton: 'animate-pulse bg-gray-200 rounded',
  
  overlay: 'absolute inset-0 bg-white/75 flex items-center justify-center',
};

// Status indicators
export const statusStyles = {
  base: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
  
  variants: {
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-primary-100 text-primary-800',
    neutral: 'bg-gray-100 text-gray-800',
  },
};

// Animation classes
export const animations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  
  // Hover animations
  hoverLift: 'hover:-translate-y-0.5 transition-transform duration-200',
  hoverGlow: 'hover:shadow-lg transition-shadow duration-200',
};

// Layout utilities
export const layoutStyles = {
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  
  grid: {
    cols1: 'grid grid-cols-1 gap-6',
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  },
  
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
};

// Responsive breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};