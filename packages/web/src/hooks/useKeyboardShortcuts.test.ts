// Keyboard shortcuts hook tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../utils/testUtils';
import { useKeyboardShortcuts, formatShortcut } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockAction = vi.fn();
  
  const shortcuts = [
    {
      key: 'n',
      metaKey: true,
      action: mockAction,
      description: 'New item',
    },
    {
      key: 'Escape',
      action: mockAction,
      description: 'Cancel',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', mockAction);
  });

  it('should trigger action when correct key combination is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    // Simulate Cmd+N
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
    });
    
    document.dispatchEvent(event);
    
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should trigger action for Escape key', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    // Simulate Escape
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
    });
    
    document.dispatchEvent(event);
    
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when disabled', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
    });
    
    document.dispatchEvent(event);
    
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should not trigger when typing in input field', () => {
    // Create an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      target: input,
    } as any);
    
    document.dispatchEvent(event);
    
    expect(mockAction).not.toHaveBeenCalled();
    
    // Clean up
    document.body.removeChild(input);
  });
});

describe('formatShortcut', () => {
  it('should format shortcut with meta key', () => {
    const shortcut = {
      key: 'n',
      metaKey: true,
      action: () => {},
      description: 'New',
    };
    
    expect(formatShortcut(shortcut)).toBe('⌘ + N');
  });

  it('should format shortcut with multiple modifiers', () => {
    const shortcut = {
      key: 's',
      metaKey: true,
      shiftKey: true,
      action: () => {},
      description: 'Save as',
    };
    
    expect(formatShortcut(shortcut)).toBe('⌘ + ⇧ + S');
  });

  it('should format shortcut without modifiers', () => {
    const shortcut = {
      key: 'Escape',
      action: () => {},
      description: 'Cancel',
    };
    
    expect(formatShortcut(shortcut)).toBe('ESCAPE');
  });
});