#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TodoService } from './services/todo-service.js';
import { EventService } from './services/event-service.js';
import { DataExtractionService } from './services/data-extraction-service.js';
import { verifyFirebaseConnection } from './firebase-config.js';

// Type for arguments
interface ToolArguments {
  [key: string]: any;
}

// Initialize services
const todoService = new TodoService();
const eventService = new EventService();
const dataService = new DataExtractionService();

// Create MCP server
const server = new Server(
  {
    name: 'mcp-famapp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // TODO Tools
    {
      name: 'todo_list',
      description: 'List all todos or filter by status/assignee',
      inputSchema: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['all', 'pending', 'completed'],
            description: 'Filter by todo status' 
          },
          assignee: { 
            type: 'string',
            description: 'Filter by assignee (gonzalo, mpaz, borja, melody)' 
          }
        },
      },
    },
    {
      name: 'todo_create',
      description: 'Create a new todo item',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Todo title' },
          description: { type: 'string', description: 'Todo description' },
          assignedTo: { type: 'string', description: 'Assign to family member' },
          dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high'],
            description: 'Priority level' 
          }
        },
        required: ['title'],
      },
    },
    {
      name: 'todo_update',
      description: 'Update an existing todo',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Todo ID' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
          completed: { type: 'boolean', description: 'Mark as completed' },
          assignedTo: { type: 'string', description: 'Reassign to family member' },
          dueDate: { type: 'string', description: 'New due date (YYYY-MM-DD)' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high'],
            description: 'New priority level' 
          }
        },
        required: ['id'],
      },
    },
    {
      name: 'todo_delete',
      description: 'Delete a todo item',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Todo ID to delete' }
        },
        required: ['id'],
      },
    },
    
    // EVENT Tools
    {
      name: 'event_list',
      description: 'List all events or upcoming events',
      inputSchema: {
        type: 'object',
        properties: {
          upcoming: { type: 'boolean', description: 'Show only upcoming events' },
          days: { type: 'number', description: 'Number of days ahead to look' },
          assignee: { type: 'string', description: 'Filter by assignee' }
        },
      },
    },
    {
      name: 'event_create',
      description: 'Create a new calendar event',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Event description' },
          startDate: { type: 'string', description: 'Start date and time (ISO format)' },
          endDate: { type: 'string', description: 'End date and time (ISO format)' },
          allDay: { type: 'boolean', description: 'Is this an all-day event?' },
          location: { type: 'string', description: 'Event location' },
          assignedTo: { type: 'string', description: 'Assign to family member' },
          category: { type: 'string', description: 'Event category (education, holiday, etc)' },
          color: { type: 'string', description: 'Event color (hex code)' }
        },
        required: ['title', 'startDate', 'endDate'],
      },
    },
    {
      name: 'event_update',
      description: 'Update an existing event',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event ID' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
          startDate: { type: 'string', description: 'New start date (ISO format)' },
          endDate: { type: 'string', description: 'New end date (ISO format)' },
          allDay: { type: 'boolean', description: 'Is this an all-day event?' },
          location: { type: 'string', description: 'New location' },
          assignedTo: { type: 'string', description: 'Reassign to family member' },
          category: { type: 'string', description: 'New category' },
          color: { type: 'string', description: 'New color (hex code)' }
        },
        required: ['id'],
      },
    },
    {
      name: 'event_delete',
      description: 'Delete a calendar event',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event ID to delete' }
        },
        required: ['id'],
      },
    },
    
    // DATA EXTRACTION Tools
    {
      name: 'family_summary',
      description: 'Get a comprehensive summary of family data (todos, events, etc)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'weekly_agenda',
      description: 'Get the upcoming agenda for the family',
      inputSchema: {
        type: 'object',
        properties: {
          days: { 
            type: 'number', 
            description: 'Number of days to look ahead (default: 7)' 
          }
        },
      },
    },
  ],
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const typedArgs = args as ToolArguments;

  try {
    switch (name) {
      // TODO Operations
      case 'todo_list': {
        const { status = 'all', assignee } = typedArgs;
        let todos;
        
        if (assignee) {
          todos = await todoService.getTodosByAssignee(assignee);
        } else if (status === 'pending') {
          todos = await todoService.getPendingTodos();
        } else {
          todos = await todoService.getAllTodos();
        }
        
        if (status === 'completed' && !assignee) {
          todos = todos.filter(t => t.completed);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(todos, null, 2),
            },
          ],
        };
      }

      case 'todo_create': {
        const { dueDate, ...todoData } = typedArgs;
        if (dueDate) {
          todoData.dueDate = new Date(dueDate);
        }
        
        const newTodo = await todoService.createTodo(todoData as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(newTodo, null, 2),
            },
          ],
        };
      }

      case 'todo_update': {
        const { id, dueDate, ...updateData } = typedArgs;
        if (dueDate) {
          updateData.dueDate = new Date(dueDate);
        }
        
        const updatedTodo = await todoService.updateTodo(id, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(updatedTodo, null, 2),
            },
          ],
        };
      }

      case 'todo_delete': {
        const { id } = typedArgs;
        const result = await todoService.deleteTodo(id);
        return {
          content: [
            {
              type: 'text',
              text: `Todo ${id} deleted successfully: ${result}`,
            },
          ],
        };
      }

      // EVENT Operations
      case 'event_list': {
        const { upcoming, days = 14, assignee } = typedArgs;
        let events;
        
        if (assignee) {
          events = await eventService.getEventsByAssignee(assignee);
        } else if (upcoming) {
          events = await eventService.getUpcomingEvents(days);
        } else {
          events = await eventService.getAllEvents();
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      case 'event_create': {
        const { startDate, endDate, ...eventData } = typedArgs;
        eventData.startDate = new Date(startDate);
        eventData.endDate = new Date(endDate);
        
        const newEvent = await eventService.createEvent(eventData as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(newEvent, null, 2),
            },
          ],
        };
      }

      case 'event_update': {
        const { id, startDate, endDate, ...updateData } = typedArgs;
        if (startDate) {
          updateData.startDate = new Date(startDate);
        }
        if (endDate) {
          updateData.endDate = new Date(endDate);
        }
        
        const updatedEvent = await eventService.updateEvent(id, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(updatedEvent, null, 2),
            },
          ],
        };
      }

      case 'event_delete': {
        const { id } = typedArgs;
        const result = await eventService.deleteEvent(id);
        return {
          content: [
            {
              type: 'text',
              text: `Event ${id} deleted successfully: ${result}`,
            },
          ],
        };
      }

      // DATA EXTRACTION Operations
      case 'family_summary': {
        const summary = await dataService.getWeeklySummary();
        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      case 'weekly_agenda': {
        const { days = 7 } = typedArgs;
        const agenda = await dataService.getUpcomingAgenda(days);
        return {
          content: [
            {
              type: 'text',
              text: agenda,
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Start the server
async function main() {
  console.error('🚀 Starting FAMAPP MCP Server...');
  
  // Verify Firebase connection
  const isConnected = await verifyFirebaseConnection();
  if (!isConnected) {
    console.error('❌ Failed to connect to Firebase. Check your configuration.');
    process.exit(1);
  }
  
  console.error('✅ Firebase connection established');
  console.error('📡 MCP Server ready for connections');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});