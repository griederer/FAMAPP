// Navigation integration test for AI Dashboard
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Navigation } from '../Navigation';
import type { ModuleId } from '../../../types/navigation';

// Mock the useTodos hook
vi.mock('../../../hooks/useTodos', () => ({
  useTodos: () => ({
    todos: []
  })
}));

describe('Navigation Integration', () => {
  const mockModuleChange = vi.fn();
  
  beforeEach(() => {
    mockModuleChange.mockClear();
  });

  test('should include AI Dashboard in navigation items', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockModuleChange}
      />
    );
    
    // Check that AI Dashboard navigation item is present
    expect(screen.getByText('AI Dashboard')).toBeInTheDocument();
  });

  test('should support AI Dashboard as a valid module ID', () => {
    const aiDashboardModule: ModuleId = 'ai-dashboard';
    
    render(
      <Navigation 
        currentModule={aiDashboardModule} 
        onModuleChange={mockModuleChange}
      />
    );
    
    // Should render without TypeScript errors
    expect(screen.getByText('AI Dashboard')).toBeInTheDocument();
  });

  test('should display all navigation items including AI Dashboard', () => {
    render(
      <Navigation 
        currentModule="todos" 
        onModuleChange={mockModuleChange}
      />
    );
    
    // Check all navigation items are present
    expect(screen.getByText('To-Do Lists')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('AI Dashboard')).toBeInTheDocument();
  });
});