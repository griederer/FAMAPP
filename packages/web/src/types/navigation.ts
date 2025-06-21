// Navigation types for FAMAPP
export type ModuleId = 'todos' | 'calendar' | 'groceries' | 'documents';

export interface NavigationItem {
  id: ModuleId;
  name: string;
  icon: React.ReactNode;
  href: string;
  badge?: number; // For notification counts
  disabled?: boolean;
}

export interface LayoutProps {
  children: React.ReactNode;
  currentModule?: ModuleId;
}