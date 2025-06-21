// Theme and styling types for FAMAPP

export type Theme = 'light' | 'dark' | 'system';

export type ColorVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'neutral';

export type Size = 'xs' | 'sm' | 'md' | 'lg';

export type FamilyMember = 'gonzalo' | 'mpaz' | 'borja' | 'melody';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
}

export interface InputProps {
  size?: Size;
  variant?: 'default' | 'error' | 'success';
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'search' | 'date' | 'number';
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  min?: string;
  autoFocus?: boolean;
}

export interface CardProps {
  variant?: 'default' | 'elevated' | 'interactive';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface FamilyTagProps {
  member: FamilyMember;
  showAvatar?: boolean;
  avatarType?: 'emoji' | 'initials' | 'photo';
  size?: Size;
  variant?: 'default' | 'compact' | 'pill' | 'minimal';
  showRole?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface FamilyAvatarProps {
  member: FamilyMember;
  size?: Size | 'xs' | 'xl' | '2xl';
  type?: 'emoji' | 'initials' | 'photo';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: () => void;
}

export interface StatusBadgeProps {
  variant: ColorVariant;
  children: React.ReactNode;
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

// Theme context types
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemPreference: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
}

// Animation types
export type AnimationType = 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'scaleIn' 
  | 'hoverLift' 
  | 'hoverGlow';

export interface AnimationProps {
  animation?: AnimationType;
  delay?: number;
  duration?: number;
}