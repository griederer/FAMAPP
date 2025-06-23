// Types for FAMAPP MCP Server

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date | string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: Date | string;
  createdBy?: string;
  completedAt?: Date | string;
  completedBy?: string;
  recurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  allDay: boolean;
  location?: string;
  assignedTo?: string;
  category?: string;
  color?: string;
  recurring?: boolean;
  createdAt: Date | string;
  createdBy?: string;
}

export interface FamilyDataSummary {
  todos: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    assignedToBreakdown: Record<string, number>;
  };
  events: {
    total: number;
    upcoming: number;
    thisWeek: number;
    nextWeek: number;
    categoryBreakdown: Record<string, number>;
  };
  lastUpdated: Date;
}