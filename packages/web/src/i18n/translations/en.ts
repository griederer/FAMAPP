// English translations for FAMAPP
import type { TranslationKeys } from '../../types/i18n';

export const en: TranslationKeys = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.all': 'All',
  'common.none': 'None',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.close': 'Close',
  'common.open': 'Open',
  'common.settings': 'Settings',
  'common.help': 'Help',
  'common.dismiss': 'Dismiss',
  'common.empty_state': 'No data available',
  'common.today': 'Today',
  'common.tomorrow': 'Tomorrow',
  'common.yesterday': 'Yesterday',
  'common.thisWeek': 'This Week',
  'common.nextWeek': 'Next Week',
  'common.thisMonth': 'This Month',
  'common.nextMonth': 'Next Month',

  // App
  'app.title': 'FAMAPP',
  'app.subtitle': 'Family Organizer',
  'app.welcome': 'Welcome to FAMAPP',
  'app.description': 'Your family organization app is being built with love ❤️',

  // Errors
  'errors.boundary.title': 'Something went wrong',
  'errors.boundary.description': 'We encountered an unexpected error. Please try refreshing the page.',
  'errors.boundary.technical_details': 'Technical Details',
  'errors.boundary.reload_page': 'Reload Page',
  'errors.boundary.go_back': 'Go Back',

  // Auth
  'auth.signIn': 'Sign In',
  'auth.signOut': 'Sign Out',
  'auth.signInWith': 'Continue with Google',
  'auth.signInError': 'Failed to sign in. Please try again.',
  'auth.accessDenied': 'Access denied. Only family members can use this app.',
  'auth.familyMembersOnly': 'Only family members can access this app',
  'auth.loading': 'Signing in...',

  // Navigation
  'nav.todos': 'To-Do',
  'nav.calendar': 'Calendar',
  'nav.groceries': 'Groceries',

  // Todos
  'todos.title': 'To-Do Lists',
  'todos.addTask': 'Add Task',
  'todos.pending': 'Pending Tasks',
  'todos.completed': 'Completed',
  'todos.total': 'Total Tasks',
  'todos.completedToday': 'Completed Today',
  'todos.recentTasks': 'Recent Tasks',
  'todos.dueToday': 'Due: Today',
  'todos.dueNextWeek': 'Due: Next week',
  'todos.assignedTo': 'Assigned to',
  'todos.markComplete': 'Mark as complete',
  'todos.markIncomplete': 'Mark as incomplete',
  'todos.confirmDelete': 'Are you sure you want to delete this todo?',
  'todos.priority.low': 'Low',
  'todos.priority.medium': 'Medium',
  'todos.priority.high': 'High',
  'todos.errorLoading': 'Error loading todos',
  'todos.emptyTitle': 'No todos yet',
  'todos.emptyDescription': 'Create your first todo to get started',
  'todos.createFirst': 'Create Todo',
  'todos.emptyFilterTitle': 'No todos found',
  'todos.emptyFilterDescription': 'No todos match the current filter. Try selecting a different family member or clear the filter.',
  
  // Todo Form
  'todos.form.title': 'Title',
  'todos.form.titlePlaceholder': 'What needs to be done?',
  'todos.form.description': 'Description',
  'todos.form.descriptionPlaceholder': 'Add more details (optional)',
  'todos.form.priority': 'Priority',
  'todos.form.assignTo': 'Assign To',
  'todos.form.dueDate': 'Due Date',
  'todos.form.tags': 'Tags',
  'todos.form.tagsPlaceholder': 'home, work, urgent',
  'todos.form.tagsHelper': 'Separate tags with commas',
  'todos.form.create': 'Create Todo',
  'todos.form.save': 'Save Changes',
  'todos.form.creating': 'Creating...',
  'todos.form.saving': 'Saving...',
  
  // Todo Validation
  'todos.validation.titleRequired': 'Title is required',
  'todos.validation.titleTooLong': 'Title must be less than 200 characters',
  'todos.validation.descriptionTooLong': 'Description must be less than 1000 characters',
  'todos.validation.dueDatePast': 'Due date cannot be in the past',
  
  // Todo Bulk Actions
  'todos.confirmBulkDelete': 'Are you sure you want to delete {count} todo(s)?',
  'todos.bulkActionsSelected': '{count} selected',
  'todos.bulkAssign': 'Assign',
  'todos.bulkComplete': 'Complete',
  'todos.bulkReopen': 'Reopen',
  'todos.bulkDelete': 'Delete',

  // Calendar
  'calendar.title': 'Calendar',
  'calendar.addEvent': 'Add Event',
  'calendar.todaysEvents': "Today's Events",
  'calendar.thisWeek': 'This Week',
  'calendar.nextMonth': 'Next Month',
  'calendar.upcomingEvents': 'Upcoming Events',
  'calendar.noEvents': 'No events scheduled',
  'calendar.allDay': 'All day',
  'calendar.organizer': 'Organizer',
  'calendar.participant': 'Participant',

  // Groceries
  'groceries.title': 'Grocery Lists',
  'groceries.newList': 'New List',
  'groceries.activeLists': 'Active Lists',
  'groceries.itemsToBuy': 'Items to Buy',
  'groceries.savedTemplates': 'Saved Templates',
  'groceries.quickTemplates': 'Quick Templates',
  'groceries.useTemplate': 'Use',
  'groceries.lastUpdated': 'Last updated',
  'groceries.items': 'items',
  'groceries.moreItems': 'more items',

  // Documents
  'documents.title': 'Family Documents',

  // Family
  'family.gonzalo': 'Gonzalo',
  'family.mpaz': 'Mpaz',
  'family.borja': 'Borja',
  'family.melody': 'Melody',
  'family.dad': 'Dad',
  'family.mom': 'Mom',
  'family.son': 'Son',
  'family.daughter': 'Daughter',
  'family.assignTo': 'Assign to family member',
  'family.selectMember': 'Select family member',
  'family.multipleSelection': 'Multiple Selection',
  'family.singleSelection': 'Single Selection',
  'family.status.online': 'Online',
  'family.status.offline': 'Offline',
  'family.status.away': 'Away',
  'family.status.busy': 'Busy',

  // Theme
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'theme.currentTheme': 'Current theme',
  'theme.clickToCycle': 'Click to cycle themes',

  // Language
  'language.english': 'English',
  'language.spanish': 'Español',
  'language.selectLanguage': 'Select language',

  // Time
  'time.justNow': 'just now',
  'time.minutesAgo': '{count} minutes ago',
  'time.hoursAgo': '{count} hours ago',
  'time.daysAgo': '{count} days ago',
  'time.weeksAgo': '{count} weeks ago',
  'time.monthsAgo': '{count} months ago',

};