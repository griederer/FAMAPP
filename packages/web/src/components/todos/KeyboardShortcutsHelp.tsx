// Keyboard shortcuts help modal
import { Modal } from '../ui';
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsHelp = ({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) => {

  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    // Group shortcuts by functionality
    if (shortcut.description.includes('Filter')) {
      groups.filters = groups.filters || [];
      groups.filters.push(shortcut);
    } else if (shortcut.description.includes('Create') || shortcut.description.includes('modal')) {
      groups.actions = groups.actions || [];
      groups.actions.push(shortcut);
    } else {
      groups.general = groups.general || [];
      groups.general.push(shortcut);
    }
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-6">
        {groupedShortcuts.actions && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              {groupedShortcuts.actions.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedShortcuts.filters && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
            <div className="space-y-2">
              {groupedShortcuts.filters.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedShortcuts.general && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">General</h3>
            <div className="space-y-2">
              {groupedShortcuts.general.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Tip: Keyboard shortcuts are disabled when typing in input fields.
          </p>
        </div>
      </div>
    </Modal>
  );
};