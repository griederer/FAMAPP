# Craighouse School Events Import

This document explains how to import the complete Craighouse School calendar events for June-July 2025 into Firebase Firestore.

## Events Included

The import includes **14 events** covering:

### June 2025
1. **Pupils return from mid-term holidays** - June 10, 8:05-15:05
2. **Year 2 Learning Together** (2 sessions) - June 11 & 12, 8:30-9:30
3. **Year 3 Field Trip** - June 12, 8:30-12:00
4. **Formative Area Parent Workshop** - June 19, 8:30-9:30
5. **Holiday - Día de los pueblos originarios** - June 20 (all day)
6. **Holiday** - June 23 (all day)
7. **Prekinder & Kinder Academic Meeting** - June 24, 8:30-9:30

### July 2025
8. **Year 1-4 Academic Meeting** - July 2, 8:30-9:30
9. **Playgroup Academic Meeting** - July 8, 8:30-9:30
10. **Last day for pupils** - July 9, 8:05-15:05
11. **First semester reports** (2 days) - July 10 & 11 (all day)
12. **Winter holidays** - July 14-21 (all day)

## Import Methods

### Method 1: Using the Web App (Recommended)

1. **Start the web application**:
   ```bash
   cd /Users/gonzaloriederer/FAMAPP/packages/web
   npm run dev
   ```

2. **Access the import page**:
   - Go to `http://localhost:5173`
   - Navigate to the import events page (you may need to add this to your routing)
   - Or directly access the `ImportEventsPage` component

3. **Run the import**:
   - Make sure you're signed in to Firebase
   - Click "Show Event Preview" to review the events
   - Click "Import All Events" to add them to Firestore

### Method 2: Browser-based Import

1. **Open the HTML import tool**:
   ```bash
   cd /Users/gonzaloriederer/FAMAPP/packages/web
   npm run dev
   ```

2. **Navigate to**: `http://localhost:5173/import-craighouse-events.html`

3. **Sign in**: Make sure you're authenticated with Firebase first

4. **Run import**: Click "Start Import" and monitor progress

### Method 3: Programmatic Import

If you want to use the utility functions directly in your code:

```typescript
import { 
  addCraighouseSchoolEvents, 
  getCraighouseSchoolEventsList,
  addCraighouseEventByIndex 
} from './utils/addCraighouseSchoolEvents';

// Preview events
const eventsList = getCraighouseSchoolEventsList();
console.log(`Will import ${eventsList.length} events`);

// Import all events
const result = await addCraighouseSchoolEvents();
console.log(`Success: ${result.success}, Failed: ${result.failed}`);

// Import single event by index (0-13)
const docId = await addCraighouseEventByIndex(0);
console.log(`Imported event with ID: ${docId}`);
```

## Event Structure

Each event is stored in Firestore with the following structure:

```javascript
{
  title: "Event Title",
  description: "Event Description with location details",
  startDate: Timestamp,     // Firebase Timestamp
  endDate: Timestamp,       // Firebase Timestamp
  allDay: boolean,          // true for holidays, false for timed events
  assignedTo: "borja",      // All events assigned to Borja
  color: "#hexcolor",       // Color coding by event type
  createdBy: "school-calendar-import",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  recurring: "none"
}
```

## Color Coding

- **Green (#10b981)**: Academic events (start/end of term)
- **Blue (#3b82f6)**: Education events (parent meetings, learning sessions)
- **Purple (#8b5cf6)**: Field trips and special activities
- **Orange (#f97316)**: Workshops and training
- **Red (#ef4444)**: Holidays and no-class days
- **Indigo (#6366f1)**: Administrative events (reports, meetings)
- **Gray (#6b7280)**: Holiday periods

## Notes

- All events are assigned to family member "borja"
- Events are marked with `createdBy: "school-calendar-import"` for identification
- The import can be run multiple times (will create duplicates)
- Times are in Chilean timezone
- All-day events don't have specific start/end times

## Troubleshooting

### Authentication Issues
- Make sure you're signed in to Firebase before running the import
- Check that your Firebase configuration is correct
- Verify Firestore security rules allow writes to the 'events' collection

### Permission Errors
- Ensure your Firebase user has write permissions to Firestore
- Check that the 'events' collection exists and is writable

### Import Failures
- Check browser console for detailed error messages
- Verify internet connection
- Ensure Firebase project is properly configured

## Files Created

1. `/src/utils/addCraighouseSchoolEvents.ts` - Main utility functions
2. `/src/components/utils/CraighouseEventImporter.tsx` - React component
3. `/src/pages/ImportEventsPage.tsx` - Import page
4. `/public/import-craighouse-events.html` - Standalone HTML import tool
5. `/src/scripts/importCraighouseEventsDirect.ts` - Direct Firebase script (Node.js)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase authentication status
3. Ensure all dependencies are installed
4. Check Firestore security rules and permissions