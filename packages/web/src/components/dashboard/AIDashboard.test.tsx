// Unit tests for AI Dashboard component
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './__tests__/test-utils';
import { AIDashboard } from './AIDashboard';
import type { AggregatedFamilyData, AIResponse } from '@famapp/shared';

// Mock hooks and services
const mockGenerateSummary = vi.fn();
const mockUseAI = {
  generateSummary: mockGenerateSummary,
  isHealthy: true,
  isLoading: false,
  error: null,
  aiService: {},
  askQuestion: vi.fn(),
  checkHealth: vi.fn()
};

const mockAggregateData = vi.fn();

vi.mock('../../hooks/useAI', () => ({
  useAI: () => mockUseAI
}));

vi.mock('../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: 'en'
  })
}));

vi.mock('@famapp/shared', () => ({
  DataAggregationService: vi.fn().mockImplementation(() => ({
    aggregateFamilyData: mockAggregateData
  }))
}));

// Mock data
const mockFamilyData: AggregatedFamilyData = {
  todos: {
    pending: [],
    overdue: [],
    completedRecent: [],
    totalCount: 15,
    completionRate: 0.6,
    memberStats: []
  },
  events: {
    upcoming: [],
    thisWeek: [],
    nextWeek: [],
    totalCount: 8,
    memberEvents: []
  },
  groceries: {
    pending: [],
    urgentItems: [],
    completedRecent: [],
    totalCount: 20,
    completionRate: 0.4,
    categoryStats: []
  },
  documents: {
    recent: [],
    totalCount: 25,
    typeStats: []
  },
  familyMembers: [],
  summary: {
    generatedAt: new Date(),
    dataFreshness: {
      todos: new Date(),
      events: new Date(),
      groceries: new Date(),
      documents: new Date(),
      overallStatus: 'fresh'
    },
    totalActiveTasks: 10,
    urgentItemsCount: 3,
    healthScore: 85,
    weeklyTrends: {
      todoCompletion: { currentWeek: 12, previousWeek: 10, change: 20, trend: 'up' },
      eventScheduling: { currentWeek: 5, previousWeek: 4, change: 25, trend: 'up' },
      groceryShopping: { currentWeek: 15, previousWeek: 18, change: -16.7, trend: 'down' },
      documentActivity: { currentWeek: 3, previousWeek: 2, change: 50, trend: 'up' }
    },
    recommendations: [
      {
        id: '1',
        type: 'task_management',
        title: 'Optimize Task Distribution',
        description: 'Consider redistributing tasks among family members',
        action: {
          actionType: 'redistribute_tasks',
          description: 'Rebalance workload',
          targetItems: [],
          estimatedTime: 15,
          difficulty: 'easy'
        },
        priority: 'medium',
        relevantMembers: [],
        estimatedImpact: 'medium'
      }
    ]
  }
};

const mockAIResponse: AIResponse = {
  type: 'family_summary',
  content: 'Your family has 15 pending tasks and 8 upcoming events this week.',
  timestamp: new Date(),
  model: 'claude-3-haiku',
  confidence: 0.9,
  metadata: {
    processingTime: 1500,
    dataFreshness: new Date(),
    suggestions: [
      {
        actionType: 'complete_task',
        description: 'Complete overdue grocery shopping',
        targetItems: ['grocery-1'],
        estimatedTime: 30,
        difficulty: 'easy'
      }
    ]
  }
};

describe('AIDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAggregateData.mockResolvedValue(mockFamilyData);
    mockGenerateSummary.mockResolvedValue(mockAIResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading States', () => {
    test('should show loading state initially', () => {
      renderWithProviders(<AIDashboard />);
      
      expect(screen.getByText('dashboard.loading')).toBeInTheDocument();
    });

    test('should show loading state when AI is loading', () => {
      mockUseAI.isLoading = true;

      renderWithProviders(<AIDashboard />);
      
      expect(screen.getByText('dashboard.loading')).toBeInTheDocument();
      
      // Reset for other tests
      mockUseAI.isLoading = false;
    });

    test('should hide loading state after data loads', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('dashboard.loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    test('should show error when data loading fails', async () => {
      mockAggregateData.mockRejectedValue(new Error('Failed to load data'));

      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
      });
    });

    test('should show AI unavailable message when service is unhealthy', async () => {
      mockUseAI.isHealthy = false;

      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.ai.unavailable')).toBeInTheDocument();
      });
      
      // Reset for other tests
      mockUseAI.isHealthy = true;
    });

    test('should show AI error message when provided', async () => {
      mockUseAI.error = 'API key invalid';

      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/API key invalid/)).toBeInTheDocument();
      });
      
      // Reset for other tests
      mockUseAI.error = null;
    });
  });

  describe('Dashboard Content', () => {
    beforeEach(() => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
    });

    test('should render dashboard header with title', async () => {
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.title')).toBeInTheDocument();
      });
    });

    test('should render refresh button', async () => {
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('dashboard.refresh');
        expect(refreshButton).toBeInTheDocument();
      });
    });

    test('should show last refresh time after loading', async () => {
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard.lastRefresh/)).toBeInTheDocument();
      });
    });

    test('should render navigation tabs', async () => {
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.summary')).toBeInTheDocument();
        expect(screen.getByText('dashboard.nav.insights')).toBeInTheDocument();
        expect(screen.getByText('dashboard.nav.alerts')).toBeInTheDocument();
        expect(screen.getByText('dashboard.nav.recommendations')).toBeInTheDocument();
      });
    });

    test('should show summary tab by default', async () => {
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        const summaryButton = screen.getByText('dashboard.nav.summary');
        expect(summaryButton).toHaveClass('active');
      });
    });
  });

  describe('AI Summary Display', () => {
    test('should display AI-generated summary when available', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(mockAIResponse.content)).toBeInTheDocument();
      });
    });

    test('should display confidence score', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard.confidence/)).toBeInTheDocument();
        expect(screen.getByText(/90%/)).toBeInTheDocument();
      });
    });

    test('should display model information', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(mockAIResponse.model)).toBeInTheDocument();
      });
    });
  });

  describe('Fallback Summary', () => {
    test('should show fallback summary when AI response is null', async () => {
      mockGenerateSummary.mockResolvedValue(null);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.summary.fallback.title')).toBeInTheDocument();
      });
    });

    test('should display statistics in fallback mode', async () => {
      mockGenerateSummary.mockResolvedValue(null);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // todos
        expect(screen.getByText('0')).toBeInTheDocument(); // events this week (empty array)
        expect(screen.getByText('20')).toBeInTheDocument(); // groceries
        expect(screen.getByText('25')).toBeInTheDocument(); // documents
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
    });

    test('should switch to insights tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.insights')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.insights'));
      
      expect(screen.getByText('dashboard.insights.title')).toBeInTheDocument();
    });

    test('should switch to alerts tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.alerts')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.alerts'));
      
      expect(screen.getByText('dashboard.alerts.title')).toBeInTheDocument();
    });

    test('should switch to recommendations tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.recommendations')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.recommendations'));
      
      expect(screen.getByText('dashboard.recommendations.title')).toBeInTheDocument();
    });

    test('should highlight active tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.insights')).toBeInTheDocument();
      });
      
      const insightsButton = screen.getByText('dashboard.nav.insights');
      await user.click(insightsButton);
      
      expect(insightsButton).toHaveClass('active');
    });
  });

  describe('Insights Tab', () => {
    test('should display insights when available', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.insights')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.insights'));
      
      expect(screen.getByText('Complete overdue grocery shopping')).toBeInTheDocument();
    });

    test('should show no insights message when none available', async () => {
      mockGenerateSummary.mockResolvedValue({
        ...mockAIResponse,
        metadata: undefined
      });
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.insights')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.insights'));
      
      expect(screen.getByText('dashboard.insights.none')).toBeInTheDocument();
    });
  });

  describe('Recommendations Tab', () => {
    test('should display recommendations from family data', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.recommendations')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.recommendations'));
      
      expect(screen.getByText('Optimize Task Distribution')).toBeInTheDocument();
      expect(screen.getByText('Consider redistributing tasks among family members')).toBeInTheDocument();
    });

    test('should show impact for recommendations', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.recommendations')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.recommendations'));
      
      expect(screen.getByText('dashboard.impact')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    test('should show no recommendations message when none available', async () => {
      const dataWithoutRecs = {
        ...mockFamilyData,
        summary: {
          ...mockFamilyData.summary,
          recommendations: []
        }
      };
      
      mockAggregateData.mockResolvedValue(dataWithoutRecs);
      
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.nav.recommendations')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dashboard.nav.recommendations'));
      
      expect(screen.getByText('dashboard.recommendations.none')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    test('should reload data when refresh button is clicked', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      const user = userEvent.setup();
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.refresh')).toBeInTheDocument();
      });
      
      // Clear previous calls
      mockAggregateData.mockClear();
      
      await user.click(screen.getByText('dashboard.refresh'));
      
      expect(mockAggregateData).toHaveBeenCalledTimes(1);
      expect(mockGenerateSummary).toHaveBeenCalled();
    });

    test('should disable refresh button while loading', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('dashboard.refresh');
        expect(refreshButton).not.toBeDisabled();
      });
      
      // Simulate loading state
      mockGenerateSummary.mockImplementation(() => new Promise(() => {}));
      
      fireEvent.click(screen.getByText('dashboard.refresh'));
      
      await waitFor(() => {
        const refreshButton = screen.getByText('dashboard.refresh');
        expect(refreshButton).toBeDisabled();
      });
    });
  });

  describe('AI Status Indicator', () => {
    test('should show AI limited warning when service is unhealthy', async () => {
      mockUseAI.isHealthy = false;
      
      // Still provide data so we don't get error state
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('dashboard.ai.limited')).toBeInTheDocument();
      });
      
      // Reset for other tests
      mockUseAI.isHealthy = true;
    });

    test('should not show AI warning when service is healthy', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      renderWithProviders(<AIDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('dashboard.ai.limited')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom className', () => {
    test('should apply custom className prop', async () => {
      mockGenerateSummary.mockResolvedValue(mockAIResponse);
      
      const { container } = renderWithProviders(<AIDashboard className="custom-dashboard" />);
      
      await waitFor(() => {
        const dashboard = container.querySelector('.ai-dashboard');
        expect(dashboard).toHaveClass('custom-dashboard');
      });
    });
  });
});