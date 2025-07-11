// Internationalization types for FAMAPP
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
  
  // Todo Form
  'todos.form.title': string;
  'todos.form.titlePlaceholder': string;
  'todos.form.description': string;
  'todos.form.descriptionPlaceholder': string;
  'todos.form.priority': string;
  'todos.form.assignTo': string;
  'todos.form.dueDate': string;
  'todos.form.tags': string;
  'todos.form.tagsPlaceholder': string;
  'todos.form.tagsHelper': string;
  'todos.form.create': string;
  'todos.form.save': string;
  'todos.form.creating': string;
  'todos.form.saving': string;
  
  // Todo Validation
  'todos.validation.titleRequired': string;
  'todos.validation.titleTooLong': string;
  'todos.validation.descriptionTooLong': string;
  'todos.validation.dueDatePast': string;
  
  // Todo Bulk Actions
  'todos.confirmBulkDelete': string;
  'todos.bulkActionsSelected': string;
  'todos.bulkAssign': string;
  'todos.bulkComplete': string;
  'todos.bulkReopen': string;
  'todos.bulkDelete': string;

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

  // Dashboard
  'dashboard.title': string;
  'dashboard.loading': string;
  'dashboard.loading.subtitle': string;
  'dashboard.refresh': string;
  'dashboard.lastRefresh': string;
  'dashboard.ai.unavailable': string;
  'dashboard.ai.limited': string;
  'dashboard.nav.summary': string;
  'dashboard.nav.insights': string;
  'dashboard.nav.alerts': string;
  'dashboard.nav.recommendations': string;
  'dashboard.nav.chat': string;
  'dashboard.confidence': string;
  'dashboard.impact': string;
  'dashboard.summary.fallback.title': string;
  'dashboard.todos.total': string;
  'dashboard.events.thisWeek': string;
  'dashboard.groceries.total': string;
  'dashboard.documents.total': string;
  'dashboard.insights.title': string;
  'dashboard.insights.none': string;
  'dashboard.alerts.title': string;
  'dashboard.alerts.none': string;
  'dashboard.recommendations.title': string;
  'dashboard.recommendations.none': string;

  // SmartCards
  'smartcards.title': string;
  'smartcards.subtitle': string;
  'smartcards.lastUpdated': string;
  'smartcards.empty.title': string;
  'smartcards.empty.description': string;
  'smartcards.trend.increase': string;
  'smartcards.trend.decrease': string;
  'smartcards.todos.title': string;
  'smartcards.todos.subtitle': string;
  'smartcards.overdue.title': string;
  'smartcards.overdue.subtitle': string;
  'smartcards.events.title': string;
  'smartcards.events.subtitle': string;
  'smartcards.groceries.title': string;
  'smartcards.groceries.subtitle': string;
  'smartcards.health.title': string;
  'smartcards.health.subtitle': string;
  'smartcards.productivity.title': string;
  'smartcards.productivity.subtitle': string;
  'smartcards.documents.title': string;
  'smartcards.documents.subtitle': string;
  'smartcards.ai.title': string;

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

  // Chat Interface
  'chat.title': string;
  'chat.clear': string;
  'chat.input.placeholder': string;
  'chat.input.hint': string;
  'chat.welcome.title': string;
  'chat.welcome.description': string;
  'chat.suggestions.title': string;
  'chat.suggestions.todos': string;
  'chat.suggestions.events': string;
  'chat.suggestions.groceries': string;
  'chat.suggestions.productivity': string;
  'chat.error.response': string;
  'chat.unavailable.title': string;
  'chat.unavailable.description': string;

}