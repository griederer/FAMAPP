// Goal Tracker Component for Family Goal Management
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { AggregatedFamilyData } from '@famapp/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import './GoalTracker.css';

// Simplified interfaces for component use
interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'organization' | 'communication' | 'health' | 'planning' | 'collaboration' | 'custom';
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  owner: any;
  milestones: GoalMilestone[];
  tags: string[];
}

interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  value: number;
  celebration?: string;
}

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  suggestedTarget: number;
  unit: string;
}

interface GoalTrackerProps {
  familyData: AggregatedFamilyData;
  className?: string;
}

// Mock goal service for component functionality
class MockGoalService {
  private goals: Goal[] = [];
  private templates: GoalTemplate[] = [
    {
      id: 'improve-completion',
      name: 'Improve Task Completion',
      description: 'Increase family task completion rate to 85%',
      category: 'productivity',
      difficulty: 'intermediate',
      suggestedTarget: 85,
      unit: '%'
    },
    {
      id: 'reduce-overdue',
      name: 'Reduce Overdue Tasks',
      description: 'Keep overdue tasks under 3 at all times',
      category: 'organization',
      difficulty: 'beginner',
      suggestedTarget: 3,
      unit: 'tasks'
    },
    {
      id: 'improve-planning',
      name: 'Better Event Planning',
      description: 'Plan events 7 days in advance',
      category: 'planning',
      difficulty: 'intermediate',
      suggestedTarget: 7,
      unit: 'days'
    }
  ];

  async getGoals(): Promise<Goal[]> {
    return this.goals;
  }

  async getActiveGoals(): Promise<Goal[]> {
    return this.goals.filter(g => g.status === 'active');
  }

  async getTemplates(): Promise<GoalTemplate[]> {
    return this.templates;
  }

  async createGoal(goalData: Partial<Goal>): Promise<Goal> {
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: goalData.title || 'New Goal',
      description: goalData.description || '',
      category: goalData.category || 'custom',
      status: 'active',
      priority: goalData.priority || 'medium',
      progress: 0,
      targetValue: goalData.targetValue || 100,
      currentValue: 0,
      unit: goalData.unit || '%',
      startDate: new Date(),
      targetDate: goalData.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: { id: 'user1', name: 'Family Member' },
      milestones: this.generateMilestones(goalData.targetValue || 100),
      tags: goalData.tags || []
    };

    this.goals.push(goal);
    return goal;
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<Goal> {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    goal.progress = Math.max(0, Math.min(100, progress));
    goal.currentValue = (goal.progress / 100) * goal.targetValue;

    // Update milestone completion
    goal.milestones.forEach(milestone => {
      if (goal.progress >= (milestone.value / goal.targetValue) * 100) {
        milestone.completed = true;
      }
    });

    // Mark as completed if 100%
    if (goal.progress >= 100) {
      goal.status = 'completed';
      goal.completedDate = new Date();
    }

    return goal;
  }

  private generateMilestones(targetValue: number): GoalMilestone[] {
    return [
      { id: 'm1', title: '25% Progress', completed: false, value: targetValue * 0.25, celebration: '🎯 Great start!' },
      { id: 'm2', title: '50% Progress', completed: false, value: targetValue * 0.5, celebration: '🚀 Halfway there!' },
      { id: 'm3', title: '75% Progress', completed: false, value: targetValue * 0.75, celebration: '💪 Almost there!' },
      { id: 'm4', title: '100% Complete', completed: false, value: targetValue, celebration: '🏆 Goal achieved!' }
    ];
  }
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  familyData,
  className = ''
}) => {
  const { t } = useI18n();
  const [goalService] = useState(() => new MockGoalService());
  const [activeView, setActiveView] = useState<'overview' | 'active' | 'create' | 'templates'>('overview');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Goal creation form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'productivity' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    targetValue: 100,
    unit: '%',
    timeframe: 'monthly'
  });

  // Load goals and templates
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [goalsData, templatesData] = await Promise.all([
        goalService.getGoals(),
        goalService.getTemplates()
      ]);

      setGoals(goalsData);
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [goalService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle goal creation
  const handleCreateGoal = async () => {
    try {
      setIsLoading(true);
      const targetDate = new Date();
      switch (newGoal.timeframe) {
        case 'weekly':
          targetDate.setDate(targetDate.getDate() + 7);
          break;
        case 'monthly':
          targetDate.setDate(targetDate.getDate() + 30);
          break;
        case 'quarterly':
          targetDate.setDate(targetDate.getDate() + 90);
          break;
      }

      await goalService.createGoal({
        ...newGoal,
        targetDate
      });

      // Reset form
      setNewGoal({
        title: '',
        description: '',
        category: 'productivity',
        priority: 'medium',
        targetValue: 100,
        unit: '%',
        timeframe: 'monthly'
      });
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (goalId: string, newProgress: number) => {
    try {
      await goalService.updateGoalProgress(goalId, newProgress);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate) => {
    setNewGoal({
      title: template.name,
      description: template.description,
      category: template.category as Goal['category'],
      priority: 'medium',
      targetValue: template.suggestedTarget,
      unit: template.unit,
      timeframe: 'monthly'
    });
    setShowCreateForm(true);
    setActiveView('create');
  };

  // Calculate overview stats
  const overviewStats = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    averageProgress: goals.length > 0 
      ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length 
      : 0
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return 'var(--color-success)';
    if (progress >= 50) return 'var(--color-info)';
    if (progress >= 25) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'productivity': return '📈';
      case 'organization': return '📋';
      case 'communication': return '💬';
      case 'health': return '🏥';
      case 'planning': return '📅';
      case 'collaboration': return '🤝';
      default: return '🎯';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'var(--color-danger)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      case 'low': return 'var(--color-success)';
      default: return 'var(--text-secondary)';
    }
  };

  const renderOverview = () => (
    <div className="goal-overview">
      {/* Overview Stats */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">{overviewStats.totalGoals}</div>
          <div className="stat-label">{t('goals.totalGoals')}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{overviewStats.activeGoals}</div>
          <div className="stat-label">{t('goals.activeGoals')}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{overviewStats.completedGoals}</div>
          <div className="stat-label">{t('goals.completedGoals')}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{Math.round(overviewStats.averageProgress)}%</div>
          <div className="stat-label">{t('goals.averageProgress')}</div>
        </Card>
      </div>

      {/* Recent Goals */}
      <Card className="recent-goals">
        <h3>{t('goals.recentGoals')}</h3>
        {goals.slice(0, 3).map(goal => (
          <div key={goal.id} className="goal-summary">
            <div className="goal-info">
              <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
              <div className="goal-details">
                <h4>{goal.title}</h4>
                <p>{goal.description}</p>
              </div>
            </div>
            <div className="goal-progress-summary">
              <div className="progress-circle" style={{ '--progress': goal.progress } as any}>
                <span>{Math.round(goal.progress)}%</span>
              </div>
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="no-goals">
            <p>{t('goals.noGoals')}</p>
            <Button onClick={() => setActiveView('templates')}>
              {t('goals.getStarted')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const renderActiveGoals = () => (
    <div className="active-goals">
      <div className="goals-grid">
        {goals.filter(g => g.status === 'active').map(goal => (
          <Card key={goal.id} className="goal-card">
            <div className="goal-header">
              <div className="goal-title-section">
                <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
                <div>
                  <h3>{goal.title}</h3>
                  <p className="goal-description">{goal.description}</p>
                </div>
              </div>
              <div className="goal-meta">
                <span 
                  className="priority-badge" 
                  style={{ backgroundColor: getPriorityColor(goal.priority) }}
                >
                  {goal.priority}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-info">
                <span>{t('goals.progress')}: {Math.round(goal.progress)}%</span>
                <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${goal.progress}%`,
                    backgroundColor: getProgressColor(goal.progress)
                  }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="milestones-section">
              <h4>{t('goals.milestones')}</h4>
              <div className="milestones-list">
                {goal.milestones.map(milestone => (
                  <div 
                    key={milestone.id} 
                    className={`milestone ${milestone.completed ? 'completed' : ''}`}
                  >
                    <span className="milestone-icon">
                      {milestone.completed ? '✅' : '⭕'}
                    </span>
                    <span className="milestone-title">{milestone.title}</span>
                    {milestone.completed && milestone.celebration && (
                      <span className="milestone-celebration">{milestone.celebration}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Controls */}
            <div className="goal-actions">
              <div className="progress-controls">
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => handleProgressUpdate(goal.id, Math.max(0, goal.progress - 10))}
                >
                  -10%
                </Button>
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                >
                  +10%
                </Button>
                <Button 
                  variant="primary" 
                  size="small"
                  onClick={() => handleProgressUpdate(goal.id, 100)}
                >
                  {t('goals.complete')}
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="goal-timeline">
              <div className="timeline-info">
                <span>{t('goals.started')}: {goal.startDate.toLocaleDateString()}</span>
                <span>{t('goals.target')}: {goal.targetDate.toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {goals.filter(g => g.status === 'active').length === 0 && (
        <Card className="no-active-goals">
          <h3>{t('goals.noActiveGoals')}</h3>
          <p>{t('goals.createFirstGoal')}</p>
          <Button onClick={() => setActiveView('templates')}>
            {t('goals.browseTemplates')}
          </Button>
        </Card>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="goal-templates">
      <div className="templates-header">
        <h3>{t('goals.suggestedGoals')}</h3>
        <p>{t('goals.templatesDescription')}</p>
      </div>
      
      <div className="templates-grid">
        {templates.map(template => (
          <Card key={template.id} className="template-card">
            <div className="template-header">
              <span className="template-icon">{getCategoryIcon(template.category)}</span>
              <div>
                <h4>{template.name}</h4>
                <span className={`difficulty-badge ${template.difficulty}`}>
                  {template.difficulty}
                </span>
              </div>
            </div>
            
            <p className="template-description">{template.description}</p>
            
            <div className="template-details">
              <div className="template-target">
                <span>{t('goals.target')}: {template.suggestedTarget} {template.unit}</span>
              </div>
              <div className="template-category">
                <span>{t('goals.category')}: {template.category}</span>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              onClick={() => handleTemplateSelect(template)}
              className="template-select-btn"
            >
              {t('goals.useTemplate')}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="goal-create-form">
      <Card className="create-form-card">
        <h3>{t('goals.createNewGoal')}</h3>
        
        <div className="form-group">
          <label>{t('goals.title')}</label>
          <input
            type="text"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            placeholder={t('goals.titlePlaceholder')}
          />
        </div>
        
        <div className="form-group">
          <label>{t('goals.description')}</label>
          <textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            placeholder={t('goals.descriptionPlaceholder')}
            rows={3}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{t('goals.category')}</label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
            >
              <option value="productivity">Productivity</option>
              <option value="organization">Organization</option>
              <option value="communication">Communication</option>
              <option value="health">Health</option>
              <option value="planning">Planning</option>
              <option value="collaboration">Collaboration</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{t('goals.priority')}</label>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as Goal['priority'] })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{t('goals.targetValue')}</label>
            <input
              type="number"
              value={newGoal.targetValue}
              onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="form-group">
            <label>{t('goals.unit')}</label>
            <input
              type="text"
              value={newGoal.unit}
              onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
              placeholder="%"
            />
          </div>
          
          <div className="form-group">
            <label>{t('goals.timeframe')}</label>
            <select
              value={newGoal.timeframe}
              onChange={(e) => setNewGoal({ ...newGoal, timeframe: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateGoal}
            disabled={!newGoal.title.trim()}
          >
            {t('goals.createGoal')}
          </Button>
        </div>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`goal-tracker ${className}`}>
        <LoadingState message={t('goals.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`goal-tracker ${className}`}>
        <ErrorMessage message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={`goal-tracker ${className}`}>
      {/* Header */}
      <div className="goal-tracker-header">
        <h2>{t('goals.title')}</h2>
        <div className="header-actions">
          <Button 
            variant="outline" 
            onClick={() => setActiveView('templates')}
          >
            {t('goals.browseTemplates')}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowCreateForm(true);
              setActiveView('create');
            }}
          >
            {t('goals.createGoal')}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="goal-tabs">
        <button
          className={`tab-button ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          {t('goals.overview')}
        </button>
        <button
          className={`tab-button ${activeView === 'active' ? 'active' : ''}`}
          onClick={() => setActiveView('active')}
        >
          {t('goals.activeGoals')} ({overviewStats.activeGoals})
        </button>
        <button
          className={`tab-button ${activeView === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveView('templates')}
        >
          {t('goals.templates')}
        </button>
      </div>

      {/* Content */}
      <div className="goal-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'active' && renderActiveGoals()}
        {activeView === 'templates' && renderTemplates()}
        {activeView === 'create' && showCreateForm && renderCreateForm()}
      </div>
    </div>
  );
};

export default GoalTracker;