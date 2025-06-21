// Enhanced family member tag component with multiple variants
import { familyMembers } from '../../styles/tokens';
import { familyTagStyles } from '../../styles/components';
import { cn } from '../../styles/components';
import { FamilyAvatar } from './FamilyAvatar';
import { useI18n } from '../../hooks';
import type { FamilyTagProps } from '../../types/theme';

export const FamilyTag = ({ 
  member, 
  showAvatar = true, 
  avatarType = 'emoji',
  size = 'md', 
  variant = 'default',
  showRole = false,
  interactive = false,
  onClick,
  className 
}: FamilyTagProps) => {
  const memberData = familyMembers[member];
  const { t } = useI18n();
  
  if (!memberData) {
    return null;
  }
  
  const sizeClasses = {
    xs: 'text-xs px-1 py-0.5 gap-0.5',
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  };

  const variantClasses = {
    default: familyTagStyles.getVariant(member),
    compact: `bg-gray-100 text-gray-700 border border-gray-200`,
    pill: `bg-white text-gray-700 border border-gray-300 rounded-full`,
    minimal: `text-gray-700 bg-transparent`,
  };

  const avatarSizeMap = {
    xs: 'xs' as const,
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  };

  const baseClasses = cn(
    familyTagStyles.base,
    variantClasses[variant],
    sizeClasses[size],
    interactive && 'cursor-pointer hover:shadow-sm transition-all duration-200',
    onClick && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
    className
  );

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <span
      className={baseClasses}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={showRole ? `${t(memberData.nameKey)} - ${t(memberData.roleKey)}` : t(memberData.nameKey)}
    >
      {showAvatar && variant !== 'minimal' && (
        <FamilyAvatar 
          member={member} 
          size={avatarSizeMap[size]}
          type={avatarType}
        />
      )}
      
      <div className="flex flex-col">
        <span className="font-medium">{t(memberData.nameKey)}</span>
        {showRole && (
          <span className="text-xs opacity-75 -mt-0.5">{t(memberData.roleKey)}</span>
        )}
      </div>
      
      {variant === 'minimal' && showAvatar && (
        <span className="text-xs opacity-60" role="img" aria-label={`${t(memberData.nameKey)} avatar`}>
          {memberData.avatar}
        </span>
      )}
    </span>
  );
};