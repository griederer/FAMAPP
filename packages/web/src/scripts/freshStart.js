// FRESH START - Complete calendar reset with PDF data only
// This will be loaded automatically when the dashboard loads

const performFreshStart = async () => {
  console.log('🔄 FRESH START: Complete calendar reset...');
  
  try {
    // Import Firebase services from the existing app
    const { getFirebaseServices } = await import('../config/firebase.js');
    const { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    
    // STEP 1: Nuclear option - delete everything
    console.log('🗑️ STEP 1: Complete database cleanup...');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    console.log(`Found ${eventsSnapshot.docs.length} events to delete`);
    
    // Delete all existing events
    const deletePromises = eventsSnapshot.docs.map(eventDoc => 
      deleteDoc(doc(db, 'events', eventDoc.id))
    );
    await Promise.all(deletePromises);
    console.log('✅ All events deleted');
    
    // STEP 2: Load ONLY official PDF data
    console.log('📄 STEP 2: Loading official PDF calendar data...');
    
    // Events exactly as they appear in the official PDF
    const officialPDFEvents = [
      // June 2025
      {
        title: "Pupils return from mid-term holidays (clases comienzan)",
        date: "2025-06-10",
        time: "8:05",
        description: "Tuesday 10th June - 8:05 - 12:35/15:05 hrs"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados, por por grupo) - Primary Assembly Hall - Entrar por la gravilla",
        date: "2025-06-11", 
        time: "8:30",
        description: "Wednesday 11th June - 08:30-9:30 hrs"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados, por por grupo) - Primary Assembly Hall - Entrar por la gravilla",
        date: "2025-06-12",
        time: "8:30", 
        description: "Thursday 12th June - 08:30-9:30 hrs"
      },
      {
        title: "Year 3 Field Trip",
        date: "2025-06-12",
        time: "8:30",
        description: "Thursday 12th June - 8:30 - 12:00 hrs"
      },
      {
        title: "Formative Area Parent Workshop - Year 3 & 4 parents invited - M/S Inquiry Centre (Area Formativa Taller de Apoderados)",
        date: "2025-06-19",
        time: "8:30",
        description: "Thursday 19th June - 08:30-9:30 hrs"
      },
      {
        title: "Holiday - Día de los pueblos originarios (no hay clases)",
        date: "2025-06-20",
        time: null,
        description: "Friday 20th June - No classes",
        allDay: true
      },
      {
        title: "Holiday (no hay clases)",
        date: "2025-06-23", 
        time: null,
        description: "Monday 23rd June - No classes",
        allDay: true
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
        date: "2025-06-24",
        time: "8:30",
        description: "Tuesday 24th June - 08:30-9:30 hrs"
      },
      
      // July 2025
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
        date: "2025-07-02",
        time: "8:30", 
        description: "Wednesday 2nd July - 08:30-9:30 hrs"
      },
      {
        title: "Playgroup Academic Meeting with Parents - M/S Inquiry Centre (Taller de Apoderados)",
        date: "2025-07-08",
        time: "8:30",
        description: "Tuesday 8th July - 08:30-9:30 hrs"
      },
      {
        title: "Last day for pupils (último día de clases)",
        date: "2025-07-09",
        time: "8:05",
        description: "Wednesday 9th July - 8:05 - 15:05 hrs"
      },
      {
        title: "First semester report/portfolio online meetings / Reuniones con apoderados online (no hay clases)",
        date: "2025-07-10",
        time: null,
        description: "Thursday 10th July - No classes",
        allDay: true
      },
      {
        title: "First semester report/portfolio online meetings / Reuniones con apoderados online (no hay clases)",
        date: "2025-07-11",
        time: null,
        description: "Friday 11th July - No classes", 
        allDay: true
      }
    ];
    
    // Convert to Firebase format and add
    for (const event of officialPDFEvents) {
      const [year, month, day] = event.date.split('-').map(Number);
      
      let startDate, endDate;
      if (event.allDay) {
        startDate = new Date(year, month - 1, day);
        endDate = new Date(year, month - 1, day);
      } else if (event.time) {
        const [hour, minute] = event.time.split(':').map(Number);
        startDate = new Date(year, month - 1, day, hour, minute);
        endDate = new Date(year, month - 1, day, hour + 1, minute); // 1 hour duration
      } else {
        startDate = new Date(year, month - 1, day);
        endDate = new Date(year, month - 1, day);
      }
      
      const eventData = {
        title: event.title,
        description: event.description,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        allDay: event.allDay || false,
        location: event.title.includes('M/S Dining Hall') ? 'M/S Dining Hall' : 
                 event.title.includes('M/S Inquiry Centre') ? 'M/S Inquiry Centre' :
                 event.title.includes('Primary Assembly Hall') ? 'Primary Assembly Hall' : '',
        assignedTo: "Borja",
        category: event.title.includes('Holiday') ? 'holiday' : 'education',
        color: event.title.includes('Holiday') ? '#e53e3e' : '#3182ce',
        recurring: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'fresh-start-pdf-import'
      };
      
      await addDoc(collection(db, 'events'), eventData);
      console.log(`✅ Added: ${event.title} - ${event.date}`);
    }
    
    console.log(`\n🎉 FRESH START COMPLETE!`);
    console.log(`📅 Loaded ${officialPDFEvents.length} events from official PDF`);
    console.log('\n📋 KEY UPCOMING EVENTS:');
    console.log('• Holiday: Monday, June 23, 2025 (all day)');
    console.log('• Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');
    console.log('• Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
    
    // Force refresh after a delay
    setTimeout(() => {
      console.log('🔄 Refreshing page to load clean data...');
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Fresh start failed:', error);
  }
};

// Auto-execute on load
window.performFreshStart = performFreshStart;
console.log('🔄 Fresh Start loaded. Execute: window.performFreshStart()');

// Auto-execute after a short delay to ensure Firebase is ready
setTimeout(() => {
  console.log('🚀 Auto-executing fresh start...');
  performFreshStart();
}, 2000);