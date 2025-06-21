// Family member avatar component with multiple display types
import { familyMembers } from '../../styles/tokens';
import { cn } from '../../styles/components';
import { useI18n } from '../../hooks';
import type { FamilyAvatarProps } from '../../types/theme';

export const FamilyAvatar = ({ 
  member, 
  size = 'md', 
  type = 'emoji', 
  showStatus = false,
  status = 'offline',
  className,
  onClick 
}: FamilyAvatarProps) => {
  const memberData = familyMembers[member];
  const { t } = useI18n();
  
  if (!memberData) {
    return null;
  }

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const statusColors = {
    online: 'bg-success-500',
    away: 'bg-warning-500',
    busy: 'bg-error-500',
    offline: 'bg-gray-400',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };

  const renderAvatarContent = () => {
    switch (type) {
      case 'initials':
        return (
          <span className="font-semibold text-white">
            {memberData.initials}
          </span>
        );
      case 'photo':
        // Placeholder for actual photo implementation
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-600">
            <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        );
      case 'emoji':
      default:
        return (
          <span role="img" aria-label={`${memberData.name} avatar`}>
            {memberData.avatar}
          </span>
        );
    }
  };

  const avatarBaseClass = cn(
    'relative inline-flex items-center justify-center rounded-full border-2 border-white transition-all duration-200',
    sizeClasses[size],
    type === 'initials' && 'text-white font-semibold',
    onClick && 'cursor-pointer hover:scale-105 hover:shadow-md',
    className
  );

  const avatarStyle = type === 'initials' ? {
    backgroundColor: memberData.color,
  } : {};

  return (
    <div className="relative inline-block">
      <div
        className={avatarBaseClass}
        style={avatarStyle}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        aria-label={`${t(memberData.nameKey)} (${t(memberData.roleKey)})`}
        title={`${t(memberData.nameKey)} - ${t(memberData.roleKey)}`}
      >
        {renderAvatarContent()}
      </div>
      
      {/* Status indicator */}
      {showStatus && (
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
          statusSizes[size],
          statusColors[status]
        )} 
        title={`Status: ${status}`}
        />
      )}
    </div>
  );
};