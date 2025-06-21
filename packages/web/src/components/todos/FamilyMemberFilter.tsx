// Family member filter component for todos
import { cn } from '../../styles/components';
import { Button } from '../ui';
import { useI18n } from '../../hooks';
import { familyMembers } from '../../styles/tokens';
import type { FamilyMember } from '../../types/theme';

export interface FamilyMemberFilterProps {
  selectedMember?: FamilyMember | null;
  onMemberSelect: (member: FamilyMember | null) => void;
  showCounts?: boolean;
  memberCounts?: Record<string, number>;
  className?: string;
}

export const FamilyMemberFilter = ({
  selectedMember,
  onMemberSelect,
  showCounts = false,
  memberCounts = {},
  className,
}: FamilyMemberFilterProps) => {
  const { t } = useI18n();

  const handleMemberClick = (member: FamilyMember) => {
    if (selectedMember === member) {
      onMemberSelect(null); // Deselect if already selected
    } else {
      onMemberSelect(member);
    }
  };

  const handleShowAll = () => {
    onMemberSelect(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {t('common.filter')} {t('nav.todos')}
        </h3>
        {selectedMember && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowAll}
            className="text-xs"
          >
            {t('common.all')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Show all button */}
        <button
          onClick={handleShowAll}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            selectedMember === null
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          )}
        >
          {t('common.all')}
          {showCounts && (
            <span className="ml-1 text-xs opacity-75">
              ({Object.values(memberCounts).reduce((sum, count) => sum + count, 0)})
            </span>
          )}
        </button>

        {/* Family member buttons */}
        {Object.entries(familyMembers).map(([memberId, member]) => {
          const isSelected = selectedMember === memberId;
          const count = memberCounts[memberId] || 0;
          
          return (
            <button
              key={memberId}
              onClick={() => handleMemberClick(memberId as FamilyMember)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200',
                count === 0 && !isSelected && 'opacity-50'
              )}
              disabled={count === 0 && !isSelected}
            >
              {/* Avatar */}
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: member.color }}
                role="img"
                aria-label={`${t(member.nameKey)} avatar`}
              >
                {member.avatar}
              </span>
              
              {/* Name */}
              <span>{t(member.nameKey)}</span>
              
              {/* Count */}
              {showCounts && (
                <span className="text-xs opacity-75">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Unassigned filter */}
      <button
        onClick={() => onMemberSelect('unassigned' as FamilyMember)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          selectedMember === ('unassigned' as FamilyMember)
            ? 'bg-gray-200 text-gray-800 border border-gray-400'
            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
        )}
      >
        <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs">
          ?
        </span>
        <span>{t('common.none')}</span>
        {showCounts && (
          <span className="text-xs opacity-75">
            ({memberCounts['unassigned'] || 0})
          </span>
        )}
      </button>
    </div>
  );
};