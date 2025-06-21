// Family member selector component for assigning tasks/events
import { useState } from 'react';
import { familyMembers } from '../../styles/tokens';
import { cn } from '../../styles/components';
import { FamilyAvatar } from './FamilyAvatar';
import { Button } from './Button';
import { useI18n } from '../../hooks';
import type { FamilyMember } from '../../types/theme';

interface FamilySelectorProps {
  selected?: FamilyMember[];
  onSelectionChange?: (members: FamilyMember[]) => void;
  multiple?: boolean;
  variant?: 'grid' | 'list' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const FamilySelector = ({
  selected = [],
  onSelectionChange,
  multiple = false,
  variant = 'grid',
  size = 'md',
  label = 'Assign to family member',
  placeholder = 'Select family member',
  className,
  disabled = false,
}: FamilySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  const memberIds = Object.keys(familyMembers) as FamilyMember[];

  const handleMemberToggle = (memberId: FamilyMember) => {
    if (disabled) return;

    let newSelection: FamilyMember[];
    
    if (multiple) {
      if (selected.includes(memberId)) {
        newSelection = selected.filter(id => id !== memberId);
      } else {
        newSelection = [...selected, memberId];
      }
    } else {
      newSelection = selected.includes(memberId) ? [] : [memberId];
      setIsOpen(false);
    }
    
    onSelectionChange?.(newSelection);
  };

  const renderGridVariant = () => (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {memberIds.map((memberId) => {
          const member = familyMembers[memberId];
          const isSelected = selected.includes(memberId);
          
          return (
            <button
              key={memberId}
              onClick={() => handleMemberToggle(memberId)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${t(member.nameKey)}`}
            >
              <FamilyAvatar 
                member={memberId} 
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
                type="emoji"
              />
              <span className="text-xs font-medium mt-1">{t(member.nameKey)}</span>
              <span className="text-xs text-gray-500">{t(member.roleKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderListVariant = () => (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {memberIds.map((memberId) => {
          const member = familyMembers[memberId];
          const isSelected = selected.includes(memberId);
          
          return (
            <button
              key={memberId}
              onClick={() => handleMemberToggle(memberId)}
              disabled={disabled}
              className={cn(
                'w-full flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200',
                'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={isSelected}
            >
              <FamilyAvatar 
                member={memberId} 
                size="sm"
                type="emoji"
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{t(member.nameKey)}</p>
                <p className="text-xs text-gray-500">{t(member.roleKey)}</p>
              </div>
              {isSelected && (
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDropdownVariant = () => (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center space-x-2">
          {selected.length > 0 ? (
            <div className="flex items-center space-x-1">
              {selected.slice(0, 2).map((memberId) => (
                <FamilyAvatar 
                  key={memberId}
                  member={memberId} 
                  size="xs"
                  type="emoji"
                />
              ))}
              {selected.length > 2 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{selected.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-medium max-h-60 overflow-auto">
            {memberIds.map((memberId) => {
              const member = familyMembers[memberId];
              const isSelected = selected.includes(memberId);
              
              return (
                <button
                  key={memberId}
                  onClick={() => handleMemberToggle(memberId)}
                  className={cn(
                    'w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-primary-50'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <FamilyAvatar 
                    member={memberId} 
                    size="sm"
                    type="emoji"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t(member.nameKey)}</p>
                    <p className="text-xs text-gray-500">{t(member.roleKey)}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'list':
        return renderListVariant();
      case 'dropdown':
        return renderDropdownVariant();
      case 'grid':
      default:
        return renderGridVariant();
    }
  };

  return (
    <div className={className}>
      {renderVariant()}
    </div>
  );
};