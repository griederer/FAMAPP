// Navigation types shared between web and mobile apps

export type ModuleId = 'todos' | 'calendar' | 'groceries' | 'documents';

export interface NavigationItem {
  id: ModuleId;
  name: string;
  icon?: any; // Platform-specific icon type
  href?: string; // Web-specific
  badge?: number; // For notification counts
  disabled?: boolean;
}