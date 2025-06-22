// Test Analytics Panel Component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsPanel } from '../AnalyticsPanel';

// Mock hooks
jest.mock('../../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

// Mock family data
const mockFamilyData = {
  todos: {
    pending: [
      { id: '1', title: 'Test Task', completed: false, assignedTo: 'user1' }
    ],
    overdue: [
      { id: '2', title: 'Overdue Task', completed: false, assignedTo: 'user1' }
    ],
    completedRecent: [
      { id: '3', title: 'Completed Task', completed: true, assignedTo: 'user2' }
    ],
    totalCount: 3,
    completionRate: 0.67,
    memberStats: [
      {
        member: { id: 'user1', name: 'User 1', email: 'user1@test.com' },
        pendingTodos: 1,
        overdueTodos: 1,
        completedThisWeek: 0,
        completionRate: 0.0,
        productivity: 'low' as const
      },
      {
        member: { id: 'user2', name: 'User 2', email: 'user2@test.com' },
        pendingTodos: 0,
        overdueTodos: 0,
        completedThisWeek: 1,
        completionRate: 1.0,
        productivity: 'high' as const
      }
    ]
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
    urgentItems: [
      { id: 'g1', name: 'Milk', urgent: true }
    ],
    completedRecent: [],
    totalCount: 1,
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
      overallStatus: 'fresh' as const
    },
    totalActiveTasks: 2,
    urgentItemsCount: 1,
    healthScore: 75,
    weeklyTrends: {
      todoCompletion: { currentWeek: 0.67, previousWeek: 0.5, change: 0.17, trend: 'up' as const },
      eventScheduling: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' as const },
      groceryShopping: { currentWeek: 1.0, previousWeek: 0.8, change: 0.2, trend: 'up' as const },
      documentActivity: { currentWeek: 0, previousWeek: 0, change: 0, trend: 'stable' as const }
    },
    recommendations: []
  }
} as any;

describe('AnalyticsPanel', () => {
  test('renders analytics panel with tabs', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    expect(screen.getByText('analytics.title')).toBeInTheDocument();
    expect(screen.getByText('analytics.overview')).toBeInTheDocument();
    expect(screen.getByText('analytics.insights')).toBeInTheDocument();
    expect(screen.getByText('analytics.members')).toBeInTheDocument();
  });

  test('displays productivity metrics in overview tab', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    // Should display completion rate
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('67.0%')).toBeInTheDocument();
    
    // Should display other metrics
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('Task Velocity')).toBeInTheDocument();
    expect(screen.getByText('Tasks per Member')).toBeInTheDocument();
  });

  test('displays key performance indicators', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    expect(screen.getByText('analytics.keyMetrics')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument(); // Health score
    expect(screen.getByText('2')).toBeInTheDocument(); // Active tasks
    expect(screen.getByText('1')).toBeInTheDocument(); // Urgent items
  });

  test('switches to insights tab and displays insights', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    const insightsTab = screen.getByText('analytics.insights');
    fireEvent.click(insightsTab);
    
    // Should show insights about completion rate and urgent items
    expect(screen.getByText('Multiple Urgent Items')).toBeInTheDocument();
  });

  test('switches to members tab and displays member performance', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    const membersTab = screen.getByText('analytics.members');
    fireEvent.click(membersTab);
    
    // Should show member cards
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    
    // Should show productivity badges
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  test('allows period selection', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    const periodSelector = screen.getByDisplayValue('analytics.weekly');
    expect(periodSelector).toBeInTheDocument();
    
    // Should have options for different periods
    expect(screen.getByText('analytics.daily')).toBeInTheDocument();
    expect(screen.getByText('analytics.monthly')).toBeInTheDocument();
  });

  test('displays refresh button', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    const refreshButton = screen.getByText('analytics.refresh');
    expect(refreshButton).toBeInTheDocument();
    
    // Should be clickable
    fireEvent.click(refreshButton);
  });

  test('generates insights based on data conditions', () => {
    // Test with high completion rate
    const highPerformanceData = {
      ...mockFamilyData,
      todos: {
        ...mockFamilyData.todos,
        completionRate: 0.9
      }
    };

    render(<AnalyticsPanel familyData={highPerformanceData} />);
    
    const insightsTab = screen.getByText('analytics.insights');
    fireEvent.click(insightsTab);
    
    expect(screen.getByText('Excellent Productivity')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    const emptyData = {
      ...mockFamilyData,
      todos: {
        pending: [],
        overdue: [],
        completedRecent: [],
        totalCount: 0,
        completionRate: 0,
        memberStats: []
      },
      familyMembers: []
    };

    render(<AnalyticsPanel familyData={emptyData} />);
    
    // Should still render without errors
    expect(screen.getByText('analytics.title')).toBeInTheDocument();
  });

  test('displays trend indicators correctly', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    // Should show trend arrows
    const trendIcons = screen.getAllByText(/[↗️↘️→]/);
    expect(trendIcons.length).toBeGreaterThan(0);
  });

  test('applies correct CSS classes for insights', () => {
    render(<AnalyticsPanel familyData={mockFamilyData} />);
    
    const insightsTab = screen.getByText('analytics.insights');
    fireEvent.click(insightsTab);
    
    // Should have insight cards with appropriate classes
    const insightCards = document.querySelectorAll('.insight-card');
    expect(insightCards.length).toBeGreaterThan(0);
  });
});