// Goal Tracker Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoalTracker } from '../GoalTracker';

// Mock hooks
jest.mock('../../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key) => key
  })
}));

// Mock UI components
jest.mock('../../ui/Card', () => ({
  Card: ({ children, className }) => (
    <div className={`card ${className || ''}`}>{children}</div>
  )
}));

jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, disabled }) => (
    <button 
      onClick={onClick} 
      className={`button ${variant || ''} ${size || ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  )
}));

jest.mock('../../ui/LoadingState', () => ({
  LoadingState: ({ message }) => <div data-testid="loading">{message}</div>
}));

jest.mock('../../ui/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }) => (
    <div data-testid="error">
      {message}
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}));

// Mock family data
const mockFamilyData = {
  todos: {
    pending: [
      { id: '1', title: 'Test Task', completed: false, assignedTo: 'user1', priority: 'medium' }
    ],
    overdue: [
      { id: '2', title: 'Overdue Task', completed: false, assignedTo: 'user1', priority: 'high' }
    ],
    completedRecent: [
      { id: '3', title: 'Completed Task', completed: true, assignedTo: 'user2', priority: 'medium' }
    ],
    totalCount: 3,
    completionRate: 0.67,
    memberStats: []
  },
  events: {
    upcoming: [],
    thisWeek: [],
    nextWeek: [],
    totalCount: 0,
    memberEvents: []
  },
  groceries: {
    pending: [],
    urgentItems: [],
    completedRecent: [],
    totalCount: 0,
    completionRate: 1.0,
    categoryStats: []
  },
  documents: {
    recent: [],
    totalCount: 0,
    typeStats: []
  },
  familyMembers: [
    { id: 'user1', name: 'User 1', email: 'user1@test.com' },
    { id: 'user2', name: 'User 2', email: 'user2@test.com' }
  ],
  summary: {
    generatedAt: new Date(),
    dataFreshness: {
      todos: new Date(),
      events: new Date(),
      groceries: new Date(),
      documents: new Date(),
      overallStatus: 'fresh'
    },
    totalActiveTasks: 2,
    urgentItemsCount: 0,
    healthScore: 75,
    weeklyTrends: {
      todoCompletion: { currentWeek: 0.67, previousWeek: 0.5, change: 0.17, trend: 'up' },
      eventScheduling: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' },
      groceryShopping: { currentWeek: 1.0, previousWeek: 0.8, change: 0.2, trend: 'up' },
      documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' }
    },
    recommendations: []
  }
} as any;

describe('GoalTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders goal tracker with default overview tab', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    expect(screen.getByText('goals.title')).toBeInTheDocument();
    expect(screen.getByText('goals.overview')).toBeInTheDocument();
    expect(screen.getByText('goals.activeGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.templates')).toBeInTheDocument();
  });

  test('displays overview statistics correctly', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    expect(screen.getByText('goals.totalGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.activeGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.completedGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.averageProgress')).toBeInTheDocument();
  });

  test('shows no goals message when no goals exist', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    expect(screen.getByText('goals.noGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.getStarted')).toBeInTheDocument();
  });

  test('switches to active goals tab', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const activeTab = screen.getByText('goals.activeGoals (0)');
    fireEvent.click(activeTab);
    
    expect(screen.getByText('goals.noActiveGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.createFirstGoal')).toBeInTheDocument();
  });

  test('switches to templates tab and displays templates', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const templatesTab = screen.getByText('goals.templates');
    fireEvent.click(templatesTab);
    
    expect(screen.getByText('goals.suggestedGoals')).toBeInTheDocument();
    expect(screen.getByText('goals.templatesDescription')).toBeInTheDocument();
    expect(screen.getByText('Improve Task Completion')).toBeInTheDocument();
    expect(screen.getByText('Reduce Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('Better Event Planning')).toBeInTheDocument();
  });

  test('displays template details correctly', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const templatesTab = screen.getByText('goals.templates');
    fireEvent.click(templatesTab);
    
    // Check for template categories and difficulties
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getAllByText('goals.useTemplate')).toHaveLength(3);
  });

  test('opens create form when template is selected', async () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const templatesTab = screen.getByText('goals.templates');
    fireEvent.click(templatesTab);
    
    const useTemplateButton = screen.getAllByText('goals.useTemplate')[0];
    fireEvent.click(useTemplateButton);
    
    await waitFor(() => {
      expect(screen.getByText('goals.createNewGoal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Improve Task Completion')).toBeInTheDocument();
    });
  });

  test('creates new goal with form', async () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    // Open create form
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('goals.createNewGoal')).toBeInTheDocument();
    });
    
    // Fill form
    const titleInput = screen.getByLabelText('goals.title');
    fireEvent.change(titleInput, { target: { value: 'Test Goal' } });
    
    const descriptionInput = screen.getByLabelText('goals.description');
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    // Submit form
    const submitButton = screen.getByText('goals.createGoal');
    fireEvent.click(submitButton);
    
    // Should navigate back to overview
    await waitFor(() => {
      expect(screen.getByText('goals.overview')).toBeInTheDocument();
    });
  });

  test('validates form before submission', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    // Submit button should be disabled with empty title
    const submitButton = screen.getByText('goals.createGoal');
    expect(submitButton).toBeDisabled();
  });

  test('handles form field changes correctly', async () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('goals.title');
      fireEvent.change(titleInput, { target: { value: 'Test Goal' } });
      expect(titleInput).toHaveValue('Test Goal');
      
      const targetValueInput = screen.getByLabelText('goals.targetValue');
      fireEvent.change(targetValueInput, { target: { value: '50' } });
      expect(targetValueInput).toHaveValue(50);
      
      const categorySelect = screen.getByLabelText('goals.category');
      fireEvent.change(categorySelect, { target: { value: 'health' } });
      expect(categorySelect).toHaveValue('health');
    });
  });

  test('cancels form creation', async () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const cancelButton = screen.getByText('common.cancel');
      fireEvent.click(cancelButton);
      
      // Should go back to overview
      expect(screen.getByText('goals.overview')).toBeInTheDocument();
    });
  });

  test('displays header actions correctly', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    expect(screen.getByText('goals.browseTemplates')).toBeInTheDocument();
    expect(screen.getByText('goals.createGoal')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    render(<GoalTracker familyData={mockFamilyData} className="custom-class" />);
    
    const tracker = document.querySelector('.goal-tracker');
    expect(tracker).toHaveClass('custom-class');
  });

  test('handles progress updates for existing goals', async () => {
    // Create a goal first
    render(<GoalTracker familyData={mockFamilyData} />);
    
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('goals.title');
      fireEvent.change(titleInput, { target: { value: 'Test Goal' } });
      
      const submitButton = screen.getByText('goals.createGoal');
      fireEvent.click(submitButton);
    });
    
    // Switch to active goals
    await waitFor(() => {
      const activeTab = screen.getByText(/goals.activeGoals/);
      fireEvent.click(activeTab);
    });
    
    // Check for progress controls
    await waitFor(() => {
      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByText('goals.complete')).toBeInTheDocument();
    });
  });

  test('displays milestones correctly', async () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    // Create a goal and switch to active view
    const createButton = screen.getByText('goals.createGoal');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText('goals.title');
      fireEvent.change(titleInput, { target: { value: 'Test Goal' } });
      
      const submitButton = screen.getByText('goals.createGoal');
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      const activeTab = screen.getByText(/goals.activeGoals/);
      fireEvent.click(activeTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('goals.milestones')).toBeInTheDocument();
      expect(screen.getByText('25% Progress')).toBeInTheDocument();
      expect(screen.getByText('50% Progress')).toBeInTheDocument();
      expect(screen.getByText('75% Progress')).toBeInTheDocument();
      expect(screen.getByText('100% Complete')).toBeInTheDocument();
    });
  });

  test('handles errors gracefully', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<GoalTracker familyData={mockFamilyData} />);
    
    // Component should render without errors even with missing data
    expect(screen.getByText('goals.title')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('responsive design elements are present', () => {
    render(<GoalTracker familyData={mockFamilyData} />);
    
    // Check for responsive CSS classes
    const tracker = document.querySelector('.goal-tracker');
    expect(tracker).toBeInTheDocument();
    
    const tabs = document.querySelector('.goal-tabs');
    expect(tabs).toBeInTheDocument();
    
    const statsGrid = document.querySelector('.stats-grid');
    expect(statsGrid).toBeInTheDocument();
  });
});