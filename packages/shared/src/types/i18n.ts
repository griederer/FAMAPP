// Internationalization types shared between web and mobile apps

export type Language = 'en' | 'es';

export interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date) => string;
  formatNumber: (number: number) => string;
}

export interface TranslationKeys {
  // Common
  'common.loading': string;
  'common.error': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.add': string;
  'common.search': string;
  'common.filter': string;
  'common.all': string;
  'common.none': string;
  'common.yes': string;
  'common.no': string;
  'common.ok': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.close': string;
  'common.open': string;
  'common.settings': string;
  'common.help': string;
  'common.dismiss': string;
  'common.empty_state': string;
  'common.today': string;
  'common.tomorrow': string;
  'common.yesterday': string;
  'common.thisWeek': string;
  'common.nextWeek': string;
  'common.thisMonth': string;
  'common.nextMonth': string;

  // Errors
  'errors.boundary.title': string;
  'errors.boundary.description': string;
  'errors.boundary.technical_details': string;
  'errors.boundary.reload_page': string;
  'errors.boundary.go_back': string;

  // App
  'app.title': string;
  'app.subtitle': string;
  'app.welcome': string;
  'app.description': string;

  // Auth
  'auth.signIn': string;
  'auth.signOut': string;
  'auth.signInWith': string;
  'auth.signInError': string;
  'auth.accessDenied': string;
  'auth.familyMembersOnly': string;
  'auth.loading': string;

  // Navigation
  'nav.todos': string;
  'nav.calendar': string;
  'nav.groceries': string;
  'nav.documents': string;

  // Todos
  'todos.title': string;
  'todos.addTask': string;
  'todos.pending': string;
  'todos.completed': string;
  'todos.total': string;
  'todos.completedToday': string;
  'todos.recentTasks': string;
  'todos.dueToday': string;
  'todos.dueNextWeek': string;
  'todos.assignedTo': string;
  'todos.markComplete': string;
  'todos.markIncomplete': string;
  'todos.confirmDelete': string;
  'todos.priority.low': string;
  'todos.priority.medium': string;
  'todos.priority.high': string;
  'todos.errorLoading': string;
  'todos.emptyTitle': string;
  'todos.emptyDescription': string;
  'todos.createFirst': string;
  'todos.emptyFilterTitle': string;
  'todos.emptyFilterDescription': string;

  // Calendar
  'calendar.title': string;
  'calendar.addEvent': string;
  'calendar.todaysEvents': string;
  'calendar.thisWeek': string;
  'calendar.nextMonth': string;
  'calendar.upcomingEvents': string;
  'calendar.noEvents': string;
  'calendar.allDay': string;
  'calendar.organizer': string;
  'calendar.participant': string;

  // Groceries
  'groceries.title': string;
  'groceries.newList': string;
  'groceries.activeLists': string;
  'groceries.itemsToBuy': string;
  'groceries.savedTemplates': string;
  'groceries.quickTemplates': string;
  'groceries.useTemplate': string;
  'groceries.lastUpdated': string;
  'groceries.items': string;
  'groceries.moreItems': string;

  // Documents
  'documents.title': string;

  // Family
  'family.gonzalo': string;
  'family.mpaz': string;
  'family.borja': string;
  'family.melody': string;
  'family.dad': string;
  'family.mom': string;
  'family.son': string;
  'family.daughter': string;
  'family.assignTo': string;
  'family.selectMember': string;
  'family.multipleSelection': string;
  'family.singleSelection': string;
  'family.status.online': string;
  'family.status.offline': string;
  'family.status.away': string;
  'family.status.busy': string;

  // Theme
  'theme.light': string;
  'theme.dark': string;
  'theme.system': string;
  'theme.currentTheme': string;
  'theme.clickToCycle': string;

  // Language
  'language.english': string;
  'language.spanish': string;
  'language.selectLanguage': string;

  // Time
  'time.justNow': string;
  'time.minutesAgo': string;
  'time.hoursAgo': string;
  'time.daysAgo': string;
  'time.weeksAgo': string;
  'time.monthsAgo': string;
}