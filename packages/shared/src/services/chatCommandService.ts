// Chat Command Service - Processes natural language commands to add tasks/events/groceries
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { authService } from './authService';
import type { Todo } from '../types/todo';
import type { CalendarEvent } from '../types/calendar';
import type { GroceryItem } from '../types/grocery';

// Command types that can be detected
export type CommandType = 'add_todo' | 'add_event' | 'add_grocery' | 'add_reminder' | 'unknown';

// Command result interface
export interface CommandResult {
  type: CommandType;
  success: boolean;
  message: string;
  data?: any;
  originalText: string;
}

// Command detection patterns
const COMMAND_PATTERNS = {
  add_todo: [
    /(?:agregar|añadir|crear|nueva?)\s+(?:tarea|todo):\s*(.+)/i,
    /(?:recordar|apuntar|anotar)\s+(?:que|de)?\s*(.+)/i,
    /(?:tengo que|debo|necesito)\s+(.+)/i,
    /(?:hacer|completar|realizar)\s+(.+)/i
  ],
  add_event: [
    /(?:agendar|programar|cita|evento|reunión)\s+(.+?)\s+(?:el|para|en)\s+(.+)/i,
    /(?:el|para)\s+(\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+\w+|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+(.+)/i,
    /(?:cita con|reunión con|ver a)\s+(.+?)\s+(?:el|en)\s+(.+)/i
  ],
  add_grocery: [
    /(?:comprar|necesito|falta)\s+(.+)/i,
    /(?:agregar|añadir)\s+(?:a\s+)?(?:la\s+)?(?:lista|compras|mercado):\s*(.+)/i,
    /(?:lista de compras|supermercado):\s*(.+)/i
  ],
  add_reminder: [
    /(?:recordarme|recordar)\s+(.+?)\s+(?:el|en|para|mañana|hoy|esta\s+semana)/i,
    /(?:avisar|notificar)(?:me)?\s+(.+)/i
  ]
};

// Date parsing utilities
const DATE_PATTERNS = {
  today: /(?:hoy|today)/i,
  tomorrow: /(?:mañana|tomorrow)/i,
  thisWeek: /(?:esta\s+semana|this\s+week)/i,
  nextWeek: /(?:próxima\s+semana|la\s+semana\s+que\s+viene|next\s+week)/i,
  specificDate: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
  dayOfWeek: /(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,
  monthDay: /(\d{1,2})\s+de\s+(\w+)/i
};

const MONTHS_ES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const DAYS_ES = {
  'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'domingo': 0
};

export class ChatCommandService {
  private get db() {
    return getFirebaseServices().db;
  }

  // Main method to process chat commands
  async processCommand(text: string): Promise<CommandResult> {
    const trimmedText = text.trim();
    
    // Detect command type
    const commandType = this.detectCommandType(trimmedText);
    
    try {
      switch (commandType) {
        case 'add_todo':
          return await this.addTodo(trimmedText);
        case 'add_event':
          return await this.addEvent(trimmedText);
        case 'add_grocery':
          return await this.addGrocery(trimmedText);
        case 'add_reminder':
          return await this.addReminder(trimmedText);
        default:
          return {
            type: 'unknown',
            success: false,
            message: 'No detecté ningún comando válido. Puedes decir cosas como "agregar tarea: llamar al doctor" o "agendar cita el viernes".',
            originalText: trimmedText
          };
      }
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        type: commandType,
        success: false,
        message: `Error al procesar el comando: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        originalText: trimmedText
      };
    }
  }

  // Detect what type of command the user is trying to use
  private detectCommandType(text: string): CommandType {
    for (const [type, patterns] of Object.entries(COMMAND_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return type as CommandType;
      }
    }
    return 'unknown';
  }

  // Add a new todo item
  private async addTodo(text: string): Promise<CommandResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Extract todo description
    let description = '';
    for (const pattern of COMMAND_PATTERNS.add_todo) {
      const match = text.match(pattern);
      if (match) {
        description = match[1].trim();
        break;
      }
    }

    if (!description) {
      throw new Error('No se pudo extraer la descripción de la tarea');
    }

    // Extract due date if mentioned
    const dueDate = this.extractDate(text);

    const todoData: Omit<Todo, 'id'> = {
      title: description,
      description: '',
      completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: user.uid,
      assignedTo: user.email || user.uid,
      priority: 'medium' as any,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
      category: 'personal'
    };

    const docRef = await addDoc(collection(this.db, 'todos'), todoData);

    return {
      type: 'add_todo',
      success: true,
      message: `✅ Tarea agregada: "${description}"${dueDate ? ` para el ${dueDate.toLocaleDateString('es-ES')}` : ''}`,
      data: { id: docRef.id, ...todoData },
      originalText: text
    };
  }

  // Add a new calendar event
  private async addEvent(text: string): Promise<CommandResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    let eventTitle = '';
    let dateText = '';

    // Try different event patterns
    for (const pattern of COMMAND_PATTERNS.add_event) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 3) {
          eventTitle = match[1].trim();
          dateText = match[2].trim();
        } else if (match.length === 4) {
          dateText = match[1].trim();
          eventTitle = match[2].trim();
        }
        break;
      }
    }

    if (!eventTitle) {
      throw new Error('No se pudo extraer el título del evento');
    }

    const eventDate = this.extractDate(dateText || text);
    if (!eventDate) {
      throw new Error('No se pudo determinar la fecha del evento');
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: eventTitle,
      description: `Evento creado desde chat: ${text}`,
      startDate: Timestamp.fromDate(eventDate),
      endDate: Timestamp.fromDate(new Date(eventDate.getTime() + 60 * 60 * 1000)), // 1 hour duration
      isAllDay: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: user.uid,
      assignedTo: user.email || user.uid,
      location: '',
      category: 'personal',
      color: '#3182ce'
    };

    const docRef = await addDoc(collection(this.db, 'events'), eventData);

    return {
      type: 'add_event',
      success: true,
      message: `📅 Evento agregado: "${eventTitle}" para el ${eventDate.toLocaleDateString('es-ES')} a las ${eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      data: { id: docRef.id, ...eventData },
      originalText: text
    };
  }

  // Add a new grocery item
  private async addGrocery(text: string): Promise<CommandResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    let itemName = '';
    for (const pattern of COMMAND_PATTERNS.add_grocery) {
      const match = text.match(pattern);
      if (match) {
        itemName = match[1].trim();
        break;
      }
    }

    if (!itemName) {
      throw new Error('No se pudo extraer el nombre del producto');
    }

    const groceryData: Omit<GroceryItem, 'id'> = {
      name: itemName,
      description: `Agregado desde chat: ${text}`,
      quantity: 1,
      unit: 'unidad',
      completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: user.uid,
      assignedTo: user.email || user.uid,
      category: 'general',
      priority: 'medium' as any,
      estimatedPrice: 0
    };

    const docRef = await addDoc(collection(this.db, 'grocery_items'), groceryData);

    return {
      type: 'add_grocery',
      success: true,
      message: `🛒 Producto agregado a la lista: "${itemName}"`,
      data: { id: docRef.id, ...groceryData },
      originalText: text
    };
  }

  // Add a reminder (similar to todo but with specific date/time)
  private async addReminder(text: string): Promise<CommandResult> {
    // For now, treat reminders as todos with due dates
    return this.addTodo(text.replace(/recordarme|recordar|avisar/i, 'agregar tarea:'));
  }

  // Extract date from text
  private extractDate(text: string): Date | null {
    const now = new Date();

    // Check for "today"
    if (DATE_PATTERNS.today.test(text)) {
      return now;
    }

    // Check for "tomorrow"
    if (DATE_PATTERNS.tomorrow.test(text)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Check for "this week" - default to next Monday
    if (DATE_PATTERNS.thisWeek.test(text)) {
      const thisWeek = new Date(now);
      const daysUntilMonday = (8 - thisWeek.getDay()) % 7;
      thisWeek.setDate(thisWeek.getDate() + daysUntilMonday);
      return thisWeek;
    }

    // Check for "next week"
    if (DATE_PATTERNS.nextWeek.test(text)) {
      const nextWeek = new Date(now);
      const daysUntilNextMonday = ((8 - nextWeek.getDay()) % 7) + 7;
      nextWeek.setDate(nextWeek.getDate() + daysUntilNextMonday);
      return nextWeek;
    }

    // Check for specific date (DD/MM/YYYY or DD/MM)
    const dateMatch = text.match(DATE_PATTERNS.specificDate);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // Month is 0-indexed
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
      
      return new Date(year, month, day);
    }

    // Check for day of week
    const dayMatch = text.match(DATE_PATTERNS.dayOfWeek);
    if (dayMatch) {
      const dayName = dayMatch[0].toLowerCase();
      const targetDay = DAYS_ES[dayName as keyof typeof DAYS_ES];
      
      if (targetDay !== undefined) {
        const date = new Date(now);
        const currentDay = date.getDay();
        const daysAhead = (targetDay + 7 - currentDay) % 7;
        date.setDate(date.getDate() + (daysAhead === 0 ? 7 : daysAhead));
        return date;
      }
    }

    // Check for "DD de MONTH" format
    const monthDayMatch = text.match(DATE_PATTERNS.monthDay);
    if (monthDayMatch) {
      const day = parseInt(monthDayMatch[1]);
      const monthName = monthDayMatch[2].toLowerCase();
      const month = MONTHS_ES[monthName as keyof typeof MONTHS_ES];
      
      if (month !== undefined) {
        const date = new Date(now.getFullYear(), month, day);
        // If the date is in the past, assume next year
        if (date < now) {
          date.setFullYear(now.getFullYear() + 1);
        }
        return date;
      }
    }

    return null;
  }

  // Check if text contains a command
  static isCommand(text: string): boolean {
    const patterns = Object.values(COMMAND_PATTERNS).flat();
    return patterns.some(pattern => pattern.test(text));
  }
}

// Export singleton instance
export const chatCommandService = new ChatCommandService();