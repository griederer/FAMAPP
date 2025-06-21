// Quick assignment component for todos
import { useState } from 'react';
import { cn } from '../../styles/components';
import { Button, FamilyTag } from '../ui';
import { useI18n } from '../../hooks';
import { familyMembers } from '../../styles/tokens';
import type { FamilyMember } from '../../types/theme';

export interface QuickAssignProps {
  currentAssignee?: FamilyMember | null;
  onAssign: (member: FamilyMember | null) => void;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export const QuickAssign = ({
  currentAssignee,
  onAssign,
  loading = false,
  disabled = false,
  compact = false,
  className,
}: QuickAssignProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = (member: FamilyMember | null) => {
    onAssign(member);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Current assignee or assign button */}
      <Button
        variant="ghost"
        size={compact ? "xs" : "sm"}
        onClick={handleToggle}
        disabled={disabled || loading}
        className={cn(
          'relative',
          currentAssignee ? 'p-1' : 'px-2 py-1'
        )}
        aria-label={
          currentAssignee 
            ? t('todos.assignedTo') + ' ' + t(`family.${currentAssignee}`)
            : t('family.assignTo')
        }
      >
        {currentAssignee ? (
          <FamilyTag
            member={currentAssignee}
            size={compact ? "xs" : "sm"}
            variant="compact"
            showAvatar={!compact}
          />
        ) : (
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {!compact && <span className="text-xs">{t('family.assignTo')}</span>}
          </div>
        )}
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
            {/* Unassign option */}
            <button
              onClick={() => handleAssign(null)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2',
                !currentAssignee && 'bg-gray-50 font-medium'
              )}
            >
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                ✕
              </span>
              {t('common.none')}
            </button>

            <div className="border-t border-gray-100 my-1" />

            {/* Family members */}
            {Object.entries(familyMembers).map(([memberId, member]) => (
              <button
                key={memberId}
                onClick={() => handleAssign(memberId as FamilyMember)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2',
                  currentAssignee === memberId && 'bg-primary-50 font-medium text-primary-700'
                )}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: member.color }}
                  role="img"
                  aria-label={`${t(member.nameKey)} avatar`}
                >
                  {member.avatar}
                </span>
                <div>
                  <div className="font-medium">{t(member.nameKey)}</div>
                  <div className="text-xs text-gray-500">{t(member.roleKey)}</div>
                </div>
                {currentAssignee === memberId && (
                  <svg
                    className="w-4 h-4 ml-auto text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};