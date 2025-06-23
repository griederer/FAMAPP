import { TodoService } from './todo-service.js';
import { EventService } from './event-service.js';
import type { FamilyDataSummary, Todo, CalendarEvent } from '../types.js';

export class DataExtractionService {
  private todoService: TodoService;
  private eventService: EventService;

  constructor() {
    this.todoService = new TodoService();
    this.eventService = new EventService();
  }

  async extractFamilyDataSummary(): Promise<FamilyDataSummary> {
    try {
      // Get all todos and events
      const [todos, events] = await Promise.all([
        this.todoService.getAllTodos(),
        this.eventService.getAllEvents()
      ]);

      // Process todos
      const now = new Date();
      const completedTodos = todos.filter(t => t.completed);
      const pendingTodos = todos.filter(t => !t.completed);
      const overdueTodos = pendingTodos.filter(t => {
        if (t.dueDate) {
          const dueDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
          return dueDate < now;
        }
        return false;
      });

      // Count todos by assignee
      const todosByAssignee: Record<string, number> = {};
      todos.forEach(todo => {
        const assignee = todo.assignedTo || 'unassigned';
        todosByAssignee[assignee] = (todosByAssignee[assignee] || 0) + 1;
      });

      // Process events
      const upcomingEvents = events.filter(e => {
        const startDate = e.startDate instanceof Date ? e.startDate : new Date(e.startDate as string);
        return startDate >= now;
      });

      const thisWeekEnd = new Date(now);
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
      
      const nextWeekStart = new Date(thisWeekEnd);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

      const thisWeekEvents = upcomingEvents.filter(e => {
        const startDate = e.startDate instanceof Date ? e.startDate : new Date(e.startDate as string);
        return startDate <= thisWeekEnd;
      });

      const nextWeekEvents = upcomingEvents.filter(e => {
        const startDate = e.startDate instanceof Date ? e.startDate : new Date(e.startDate as string);
        return startDate > thisWeekEnd && startDate <= nextWeekEnd;
      });

      // Count events by category
      const eventsByCategory: Record<string, number> = {};
      events.forEach(event => {
        const category = event.category || 'uncategorized';
        eventsByCategory[category] = (eventsByCategory[category] || 0) + 1;
      });

      return {
        todos: {
          total: todos.length,
          completed: completedTodos.length,
          pending: pendingTodos.length,
          overdue: overdueTodos.length,
          assignedToBreakdown: todosByAssignee
        },
        events: {
          total: events.length,
          upcoming: upcomingEvents.length,
          thisWeek: thisWeekEvents.length,
          nextWeek: nextWeekEvents.length,
          categoryBreakdown: eventsByCategory
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to extract family data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWeeklySummary(): Promise<string> {
    try {
      const summary = await this.extractFamilyDataSummary();
      
      return `
# 📊 FAMAPP Weekly Summary

## 📋 Todos
- Total: ${summary.todos.total}
- Completed: ${summary.todos.completed} ✅
- Pending: ${summary.todos.pending} ⏳
- Overdue: ${summary.todos.overdue} ⚠️

### By Family Member:
${Object.entries(summary.todos.assignedToBreakdown)
  .map(([member, count]) => `- ${member}: ${count} tasks`)
  .join('\n')}

## 📅 Events
- Total: ${summary.events.total}
- Upcoming: ${summary.events.upcoming}
- This Week: ${summary.events.thisWeek}
- Next Week: ${summary.events.nextWeek}

### By Category:
${Object.entries(summary.events.categoryBreakdown)
  .map(([category, count]) => `- ${category}: ${count} events`)
  .join('\n')}

_Last updated: ${summary.lastUpdated.toLocaleString()}_
      `.trim();
    } catch (error) {
      throw new Error(`Failed to generate weekly summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUpcomingAgenda(days: number = 7): Promise<string> {
    try {
      const events = await this.eventService.getUpcomingEvents(days);
      const pendingTodos = await this.todoService.getPendingTodos();
      
      // Filter todos with due dates in the next N days
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const upcomingTodos = pendingTodos.filter(todo => {
        if (todo.dueDate) {
          const dueDate = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate);
          return dueDate >= now && dueDate <= futureDate;
        }
        return false;
      });

      let agenda = `# 📅 Upcoming Agenda (Next ${days} days)\n\n`;
      
      if (events.length > 0) {
        agenda += "## 🗓️ Events\n";
        events.forEach(event => {
          const startDate = event.startDate instanceof Date 
            ? event.startDate 
            : new Date(event.startDate as string);
          const dateStr = startDate.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const timeStr = event.allDay 
            ? 'All day' 
            : startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          
          agenda += `\n### ${event.title}\n`;
          agenda += `- 📅 ${dateStr}\n`;
          agenda += `- ⏰ ${timeStr}\n`;
          if (event.location) agenda += `- 📍 ${event.location}\n`;
          if (event.assignedTo) agenda += `- 👤 ${event.assignedTo}\n`;
          if (event.description) agenda += `- 📝 ${event.description}\n`;
        });
      }
      
      if (upcomingTodos.length > 0) {
        agenda += "\n## ✅ Due Tasks\n";
        upcomingTodos.forEach(todo => {
          const dueDate = todo.dueDate instanceof Date 
            ? todo.dueDate 
            : new Date(todo.dueDate as string);
          const dateStr = dueDate.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          
          agenda += `\n- **${todo.title}** (Due: ${dateStr})`;
          if (todo.assignedTo) agenda += ` - Assigned to: ${todo.assignedTo}`;
          if (todo.priority) agenda += ` - Priority: ${todo.priority}`;
          agenda += '\n';
        });
      }
      
      if (events.length === 0 && upcomingTodos.length === 0) {
        agenda += "\n_No upcoming events or tasks in the next " + days + " days._\n";
      }
      
      return agenda;
    } catch (error) {
      throw new Error(`Failed to get upcoming agenda: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}