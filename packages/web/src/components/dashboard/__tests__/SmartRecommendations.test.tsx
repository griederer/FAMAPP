// Smart Recommendations Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartRecommendations } from '../SmartRecommendations';

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
  Button: ({ children, onClick, variant, size, disabled, className }) => (
    <button 
      onClick={onClick} 
      className={`button ${variant || ''} ${size || ''} ${className || ''}`}
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
      { id: '2', title: 'Overdue Task', completed: false, assignedTo: 'user1', priority: 'high' },
      { id: '3', title: 'Another Overdue', completed: false, assignedTo: 'user2', priority: 'high' },
      { id: '4', title: 'Third Overdue', completed: false, assignedTo: 'user1', priority: 'medium' },
      { id: '5', title: 'Fourth Overdue', completed: false, assignedTo: 'user2', priority: 'low' }
    ],
    completedRecent: [
      { id: '6', title: 'Completed Task', completed: true, assignedTo: 'user2', priority: 'medium' }
    ],
    totalCount: 6,
    completionRate: 0.5, // Low completion rate to trigger recommendations
    memberStats: []
  },
  events: {
    upcoming: [
      { id: 'e1', title: 'Event 1', startDate: new Date() },
      { id: 'e2', title: 'Event 2', startDate: new Date() },
      { id: 'e3', title: 'Event 3', startDate: new Date() },
      { id: 'e4', title: 'Event 4', startDate: new Date() },
      { id: 'e5', title: 'Event 5', startDate: new Date() },
      { id: 'e6', title: 'Event 6', startDate: new Date() }
    ],
    thisWeek: [],
    nextWeek: [],
    totalCount: 6,
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
    totalActiveTasks: 5,
    urgentItemsCount: 0,
    healthScore: 45, // Low health score
    weeklyTrends: {
      todoCompletion: { currentWeek: 0.5, previousWeek: 0.6, change: -0.1, trend: 'down' },
      eventScheduling: { currentWeek: 6, previousWeek: 3, change: 3, trend: 'up' },
      groceryShopping: { currentWeek: 1.0, previousWeek: 0.8, change: 0.2, trend: 'up' },
      documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' }
    },
    recommendations: []
  }
};

describe('SmartRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders smart recommendations component', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('recommendations.title')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('displays header with navigation and actions', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  test('generates data-driven recommendations based on family data', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      // Should generate overdue task recommendation due to 4 overdue tasks
      expect(screen.getByText('Tackle Overdue Tasks')).toBeInTheDocument();
      expect(screen.getByText(/You have 4 overdue tasks/)).toBeInTheDocument();
      
      // Should generate task completion recommendation due to 50% completion rate
      expect(screen.getByText('Improve Task Completion Rate')).toBeInTheDocument();
      expect(screen.getByText(/Your family's task completion rate is 50%/)).toBeInTheDocument();
      
      // Should generate schedule optimization due to 6 upcoming events
      expect(screen.getByText('Optimize Busy Schedule')).toBeInTheDocument();
      expect(screen.getByText(/You have 6 upcoming events/)).toBeInTheDocument();
    });
  });

  test('displays recommendation priorities correctly', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      // Overdue tasks should be critical priority
      const criticalBadges = screen.getAllByText('critical');
      expect(criticalBadges.length).toBeGreaterThan(0);
      
      // Task completion should be high priority
      const highBadges = screen.getAllByText('high');
      expect(highBadges.length).toBeGreaterThan(0);
      
      // Schedule optimization should be medium priority
      const mediumBadges = screen.getAllByText('medium');
      expect(mediumBadges.length).toBeGreaterThan(0);
    });
  });

  test('displays confidence scores for recommendations', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('95% confident')).toBeInTheDocument();
      expect(screen.getByText('85% confident')).toBeInTheDocument();
      expect(screen.getByText('80% confident')).toBeInTheDocument();
    });
  });

  test('shows summary statistics', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('New Recommendations')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Immediate Action')).toBeInTheDocument();
    });
  });

  test('expands and collapses recommendation details', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const showDetailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('AI Reasoning:')).toBeInTheDocument();
      expect(screen.getByText('Implementation Steps:')).toBeInTheDocument();
      
      const showLessButton = screen.getByText('Show Less');
      fireEvent.click(showLessButton);
      
      expect(screen.queryByText('AI Reasoning:')).not.toBeInTheDocument();
    });
  });

  test('displays action steps when expanded', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const showDetailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('Implementation Steps:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Step number
      expect(screen.getByText(/Schedule a 1-hour family meeting/)).toBeInTheDocument();
    });
  });

  test('handles accept recommendation action', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} enableActions={true} />);
    
    await waitFor(() => {
      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);
      
      // Should show accepted status
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });
  });

  test('handles dismiss recommendation action', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} enableActions={true} />);
    
    await waitFor(() => {
      const dismissButtons = screen.getAllByText('Dismiss');
      fireEvent.click(dismissButtons[0]);
      
      // Should show dismissed status
      expect(screen.getByText('Dismissed')).toBeInTheDocument();
    });
  });

  test('switches to analytics view', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const analyticsButton = screen.getByText('Analytics');
      fireEvent.click(analyticsButton);
      
      expect(screen.getByText('Total Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Acceptance Rate')).toBeInTheDocument();
      expect(screen.getByText('Implementation Rate')).toBeInTheDocument();
      expect(screen.getByText('Average Impact Score')).toBeInTheDocument();
    });
  });

  test('displays analytics insights', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const analyticsButton = screen.getByText('Analytics');
      fireEvent.click(analyticsButton);
      
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText(/Your family has a.*acceptance rate/)).toBeInTheDocument();
      expect(screen.getByText(/Implemented recommendations show/)).toBeInTheDocument();
    });
  });

  test('handles refresh action', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      // Should trigger loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  test('displays expected impact information', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('Expected Impact:')).toBeInTheDocument();
      expect(screen.getByText('Time to Implement:')).toBeInTheDocument();
      expect(screen.getByText(/30 percentage per immediate/)).toBeInTheDocument();
      expect(screen.getByText(/60 minutes/)).toBeInTheDocument();
    });
  });

  test('shows recommendation generation timestamps', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const today = new Date().toLocaleDateString();
      expect(screen.getByText(`Generated ${today}`)).toBeInTheDocument();
    });
  });

  test('displays relevance scores', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Relevance: \d+%/)).toBeInTheDocument();
    });
  });

  test('respects maxDisplayRecommendations prop', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} maxDisplayRecommendations={2} />);
    
    await waitFor(() => {
      const recommendationCards = document.querySelectorAll('.recommendation-card');
      expect(recommendationCards.length).toBeLessThanOrEqual(2);
    });
  });

  test('disables actions when enableActions is false', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} enableActions={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
      expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
    });
  });

  test('applies custom className', () => {
    render(<SmartRecommendations familyData={mockFamilyData} className="custom-class" />);
    
    const component = document.querySelector('.smart-recommendations');
    expect(component).toHaveClass('custom-class');
  });

  test('handles empty recommendations state', async () => {
    const emptyFamilyData = {
      ...mockFamilyData,
      todos: {
        ...mockFamilyData.todos,
        overdue: [], // No overdue tasks
        completionRate: 0.9 // High completion rate
      },
      events: {
        ...mockFamilyData.events,
        upcoming: [] // No upcoming events
      },
      summary: {
        ...mockFamilyData.summary,
        healthScore: 85 // High health score
      }
    };

    render(<SmartRecommendations familyData={emptyFamilyData} />);
    
    await waitFor(() => {
      expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
      expect(screen.getByText(/No new recommendations at the moment/)).toBeInTheDocument();
      expect(screen.getByText('Check for New Suggestions')).toBeInTheDocument();
    });
  });

  test('displays category and type icons', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      // Category icons
      expect(screen.getByText('⚡')).toBeInTheDocument(); // immediate
      expect(screen.getByText('📅')).toBeInTheDocument(); // short_term
      
      // Type icons
      expect(screen.getByText('😌')).toBeInTheDocument(); // stress_reduction
      expect(screen.getByText('✅')).toBeInTheDocument(); // task_optimization
      expect(screen.getByText('📆')).toBeInTheDocument(); // schedule_improvement
    });
  });

  test('handles error state gracefully', async () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    // Component should render without errors even with potential data issues
    await waitFor(() => {
      expect(screen.getByText('recommendations.title')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  test('displays AI reasoning when expanded', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const showDetailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('AI Reasoning:')).toBeInTheDocument();
      expect(screen.getByText(/Multiple overdue tasks create stress/)).toBeInTheDocument();
    });
  });

  test('shows step-by-step implementation guidance', async () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    await waitFor(() => {
      const showDetailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('Implementation Steps:')).toBeInTheDocument();
      expect(screen.getByText(/~5 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/~20 minutes/)).toBeInTheDocument();
    });
  });

  test('responsive design elements are present', () => {
    render(<SmartRecommendations familyData={mockFamilyData} />);
    
    // Check for responsive CSS classes
    const component = document.querySelector('.smart-recommendations');
    expect(component).toBeInTheDocument();
    
    const header = document.querySelector('.recommendations-header');
    expect(header).toBeInTheDocument();
    
    const summary = document.querySelector('.recommendations-summary');
    expect(summary).toBeInTheDocument();
  });
});