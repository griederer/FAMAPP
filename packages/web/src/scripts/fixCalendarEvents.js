// Script to fix calendar events based on the real school calendar
// Run this in browser console after authentication

const fixCalendarEvents = async () => {
  console.log('🗓️ Starting calendar events fix...');
  
  try {
    // Get Firebase services
    const { getFirebaseServices } = await import('/src/config/firebase.js');
    const { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    
    // Step 1: Delete existing events
    console.log('🗑️ Deleting existing events...');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const deletePromises = eventsSnapshot.docs.map(eventDoc => deleteDoc(doc(db, 'events', eventDoc.id)));
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${eventsSnapshot.docs.length} existing events`);
    
    // Step 2: Add correct events from the real calendar
    console.log('📅 Adding correct events...');
    
    const correctEvents = [
      // June 2025 Events
      {
        title: "Pupils return from mid-term holidays (clases comienzan)",
        startDate: new Date(2025, 5, 10, 8, 5), // June 10, 8:05 AM
        endDate: new Date(2025, 5, 10, 9, 0),
        isAllDay: false,
        description: "Students return from holidays",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados)",
        startDate: new Date(2025, 5, 11, 8, 30), // June 11, 8:30 AM
        endDate: new Date(2025, 5, 11, 9, 30),
        isAllDay: false,
        description: "Parents invited to join learning activities",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Year 3 Field Trip",
        startDate: new Date(2025, 5, 12, 8, 30), // June 12, 8:30 AM
        endDate: new Date(2025, 5, 12, 15, 0),
        isAllDay: false,
        description: "Educational field trip for Year 3 students",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Formative Area Parent Workshop - Year 3 & 4",
        startDate: new Date(2025, 5, 19, 8, 30), // June 19, 8:30 AM
        endDate: new Date(2025, 5, 19, 9, 30),
        isAllDay: false,
        description: "Parent workshop for Year 3 & 4",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Holiday - Día de los pueblos originarios",
        startDate: new Date(2025, 5, 20), // June 20
        endDate: new Date(2025, 5, 20),
        isAllDay: true,
        description: "National holiday - Indigenous Peoples Day",
        assignedTo: "Borja",
        category: "holiday",
        color: "#e53e3e"
      },
      {
        title: "Holiday (no hay clases)",
        startDate: new Date(2025, 5, 23), // June 23 (Monday)
        endDate: new Date(2025, 5, 23),
        isAllDay: true,
        description: "School holiday - no classes",
        assignedTo: "Borja",
        category: "holiday",
        color: "#e53e3e"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 5, 24, 8, 30), // June 24, 8:30 AM (Tuesday)
        endDate: new Date(2025, 5, 24, 9, 30),
        isAllDay: false,
        description: "Taller de Apoderados - M/S Dining Hall",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      
      // July 2025 Events
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 6, 2, 8, 30), // July 2, 8:30 AM (Wednesday)
        endDate: new Date(2025, 6, 2, 9, 30),
        isAllDay: false,
        description: "Taller de Apoderados - M/S Dining Hall",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Playgroup Academic Meeting with Parents",
        startDate: new Date(2025, 6, 8, 8, 30), // July 8, 8:30 AM
        endDate: new Date(2025, 6, 8, 9, 30),
        isAllDay: false,
        description: "Academic meeting for Playgroup parents",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Last day for pupils (último día de clases)",
        startDate: new Date(2025, 6, 9, 8, 5), // July 9, 8:05 AM
        endDate: new Date(2025, 6, 9, 15, 0),
        isAllDay: false,
        description: "Last day of classes for students",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "First semester report/portfolio online meetings",
        startDate: new Date(2025, 6, 10), // July 10
        endDate: new Date(2025, 6, 11),
        isAllDay: true,
        description: "Online meetings for semester reports",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Cumpleaños Nico",
        startDate: new Date(2025, 6, 12), // July 12
        endDate: new Date(2025, 6, 12),
        isAllDay: true,
        description: "Nico's birthday celebration",
        assignedTo: "Family",
        category: "personal",
        color: "#38a169"
      },
      {
        title: "Winter holidays begin",
        startDate: new Date(2025, 6, 14), // July 14
        endDate: new Date(2025, 6, 14),
        isAllDay: true,
        description: "Start of winter holidays",
        assignedTo: "Borja",
        category: "holiday",
        color: "#e53e3e"
      },
      {
        title: "Semester 2 starts",
        startDate: new Date(2025, 6, 22, 8, 5), // July 22, 8:05 AM
        endDate: new Date(2025, 6, 22, 9, 0),
        isAllDay: false,
        description: "Beginning of second semester",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      }
    ];
    
    // Add each event to Firebase
    const addPromises = correctEvents.map(async (event) => {
      const eventData = {
        title: event.title,
        description: event.description,
        startDate: Timestamp.fromDate(event.startDate),
        endDate: Timestamp.fromDate(event.endDate),
        isAllDay: event.isAllDay,
        allDay: event.isAllDay, // For compatibility
        location: event.location || '',
        assignedTo: event.assignedTo,
        category: event.category,
        color: event.color,
        recurring: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'calendar-fix-script'
      };
      
      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log(`✅ Added: ${event.title} on ${event.startDate.toLocaleDateString('es-ES')}`);
      return docRef.id;
    });
    
    await Promise.all(addPromises);
    
    console.log(`🎉 Successfully added ${correctEvents.length} correct events!`);
    console.log('📅 Calendar events are now synchronized with the real school calendar');
    
    // Refresh the page to see changes
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error fixing calendar events:', error);
  }
};

// Make function available globally
window.fixCalendarEvents = fixCalendarEvents;

console.log('🔧 Calendar fix script loaded. Run: window.fixCalendarEvents()');