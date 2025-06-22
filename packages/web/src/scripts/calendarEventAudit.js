// Calendar Event Audit and Complete Fix Script
// This will diagnose and completely fix all calendar inconsistencies

const calendarEventAudit = async () => {
  console.log('🔍 CALENDAR AUDIT STARTING...');
  
  try {
    const { getFirebaseServices } = await import('../../config/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    console.log('📊 CURRENT DATABASE STATE:');
    console.log(`Total events found: ${eventsSnapshot.docs.length}`);
    
    const eventsByTitle = {};
    
    eventsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      const title = data.title;
      
      if (!eventsByTitle[title]) {
        eventsByTitle[title] = [];
      }
      
      eventsByTitle[title].push({
        id: doc.id,
        title,
        date: startDate,
        dateString: startDate.toLocaleDateString('es-ES'),
        timeString: startDate.toLocaleTimeString('es-ES'),
        allDay: data.allDay || data.isAllDay,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy
      });
      
      console.log(`Event ${index + 1}:`, {
        id: doc.id,
        title,
        date: startDate.toLocaleDateString('es-ES'),
        time: data.allDay ? 'All day' : startDate.toLocaleTimeString('es-ES'),
        assignedTo: data.assignedTo
      });
    });
    
    console.log('\n🔍 DUPLICATE/CONFLICT ANALYSIS:');
    Object.keys(eventsByTitle).forEach(title => {
      if (eventsByTitle[title].length > 1) {
        console.log(`❌ CONFLICT - "${title}": ${eventsByTitle[title].length} versions`);
        eventsByTitle[title].forEach((event, i) => {
          console.log(`  Version ${i + 1}: ${event.dateString} ${event.allDay ? '(All day)' : event.timeString}`);
        });
      }
    });
    
    console.log('\n📋 CANONICAL TRUTH (from official PDF):');
    console.log('1. Holiday: Monday, June 23, 2025 (all day)');
    console.log('2. Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');
    console.log('3. Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
    
    return { eventsByTitle, totalEvents: eventsSnapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
};

const fixCalendarEventsCompletely = async () => {
  console.log('🛠️ COMPLETE CALENDAR FIX STARTING...');
  
  try {
    const { getFirebaseServices } = await import('../../config/firebase.js');
    const { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    
    // STEP 1: Complete cleanup
    console.log('🗑️ STEP 1: Deleting ALL existing events...');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const deletePromises = eventsSnapshot.docs.map(eventDoc => deleteDoc(doc(db, 'events', eventDoc.id)));
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${eventsSnapshot.docs.length} events`);
    
    // STEP 2: Add ONLY canonical events from official PDF
    console.log('📅 STEP 2: Adding canonical events from official PDF...');
    
    const canonicalEvents = [
      // June Events
      {
        title: "Pupils return from mid-term holidays (clases comienzan)",
        startDate: new Date(2025, 5, 10, 8, 5), // June 10, 8:05 AM
        endDate: new Date(2025, 5, 10, 15, 5),
        allDay: false,
        description: "Students return from mid-term holidays",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados, por por grupo) - Primary Assembly Hall - Entrar por la gravilla",
        startDate: new Date(2025, 5, 11, 8, 30), // June 11, 8:30 AM
        endDate: new Date(2025, 5, 11, 9, 30),
        allDay: false,
        description: "Parents invited learning session",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados, por por grupo) - Primary Assembly Hall - Entrar por la gravilla",
        startDate: new Date(2025, 5, 12, 8, 30), // June 12, 8:30 AM  
        endDate: new Date(2025, 5, 12, 9, 30),
        allDay: false,
        description: "Parents invited learning session",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Year 3 Field Trip",
        startDate: new Date(2025, 5, 12, 8, 30), // June 12, 8:30 AM
        endDate: new Date(2025, 5, 12, 12, 0),
        allDay: false,
        description: "Educational field trip for Year 3",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Formative Area Parent Workshop - Year 3 & 4 parents invited - M/S Inquiry Centre (Area Formativa Taller de Apoderados)",
        startDate: new Date(2025, 5, 19, 8, 30), // June 19, 8:30 AM
        endDate: new Date(2025, 5, 19, 9, 30),
        allDay: false,
        description: "Parent workshop for Years 3 & 4",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Holiday - Día de los pueblos originarios (no hay clases)",
        startDate: new Date(2025, 5, 20), // June 20 - Friday
        endDate: new Date(2025, 5, 20),
        allDay: true,
        description: "Indigenous Peoples Day - No classes",
        assignedTo: "Borja",
        category: "holiday"
      },
      {
        title: "Holiday (no hay clases)",
        startDate: new Date(2025, 5, 23), // June 23 - Monday *** CANONICAL ***
        endDate: new Date(2025, 5, 23),
        allDay: true,
        description: "School holiday - No classes",
        assignedTo: "Borja",
        category: "holiday"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
        startDate: new Date(2025, 5, 24, 8, 30), // June 24 - Tuesday, 8:30 AM *** CANONICAL ***
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        description: "Academic meeting for Prekinder & Kinder parents at M/S Dining Hall",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education"
      },
      
      // July Events
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
        startDate: new Date(2025, 6, 2, 8, 30), // July 2 - Wednesday, 8:30 AM *** CANONICAL ***
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        description: "Academic meeting for Year 1-4 parents at M/S Dining Hall",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Playgroup Academic Meeting with Parents - M/S Inquiry Centre (Taller de Apoderados)",
        startDate: new Date(2025, 6, 8, 8, 30), // July 8, 8:30 AM
        endDate: new Date(2025, 6, 8, 9, 30),
        allDay: false,
        description: "Academic meeting for Playgroup parents",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Last day for pupils (último día de clases)",
        startDate: new Date(2025, 6, 9, 8, 5), // July 9, 8:05 AM
        endDate: new Date(2025, 6, 9, 15, 5),
        allDay: false,
        description: "Last day of classes for students",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "First semester report/portfolio online meetings / Reuniones con apoderados online (no hay clases)",
        startDate: new Date(2025, 6, 10), // July 10
        endDate: new Date(2025, 6, 10),
        allDay: true,
        description: "Online parent meetings - No classes",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "First semester report/portfolio online meetings / Reuniones con apoderados online (no hay clases)",
        startDate: new Date(2025, 6, 11), // July 11
        endDate: new Date(2025, 6, 11),
        allDay: true,
        description: "Online parent meetings - No classes",
        assignedTo: "Borja",
        category: "education"
      }
    ];
    
    // Add each canonical event
    for (const event of canonicalEvents) {
      const eventData = {
        title: event.title,
        description: event.description,
        startDate: Timestamp.fromDate(event.startDate),
        endDate: Timestamp.fromDate(event.endDate),
        allDay: event.allDay,
        location: event.location || '',
        assignedTo: event.assignedTo,
        category: event.category,
        color: event.category === 'holiday' ? '#e53e3e' : '#3182ce',
        recurring: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'canonical-fix-script'
      };
      
      await addDoc(collection(db, 'events'), eventData);
      console.log(`✅ Added: ${event.title} - ${event.startDate.toLocaleDateString('es-ES')}`);
    }
    
    console.log(`\n🎉 CALENDAR COMPLETELY FIXED!`);
    console.log(`📅 Added ${canonicalEvents.length} canonical events from official PDF`);
    console.log('\n📋 KEY EVENTS (CANONICAL TRUTH):');
    console.log('• Holiday: Monday, June 23, 2025 (all day)');
    console.log('• Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');  
    console.log('• Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
    
    // Clear all caches and refresh
    if (window.location) {
      console.log('🔄 Refreshing page to load clean data...');
      setTimeout(() => window.location.reload(), 3000);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
};

// Make functions globally available
window.calendarEventAudit = calendarEventAudit;
window.fixCalendarEventsCompletely = fixCalendarEventsCompletely;

console.log('🔧 Calendar audit tools loaded:');
console.log('  • window.calendarEventAudit() - Diagnose issues');
console.log('  • window.fixCalendarEventsCompletely() - Fix everything');