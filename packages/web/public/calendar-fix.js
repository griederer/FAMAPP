// CALENDAR FIX SCRIPT - Execute directly in browser console
// Copy and paste this entire script into the browser console

console.log('🛠️ LOADING CALENDAR FIX SCRIPT...');

// STEP 1: Audit current events
const auditCalendarEvents = async () => {
  console.log('🔍 CALENDAR AUDIT STARTING...');
  
  try {
    // Import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Firebase config (using your existing config)
    const firebaseConfig = {
      apiKey: "AIzaSyBE1RjPJb3_3kQ-qv6zG4PFsT1HKJB_VkY",
      authDomain: "famapp-427714.firebaseapp.com",
      projectId: "famapp-427714",
      storageBucket: "famapp-427714.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };
    
    const app = initializeApp(firebaseConfig, 'calendar-audit');
    const db = getFirestore(app);
    
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    console.log('📊 CURRENT DATABASE STATE:');
    console.log(`Total events found: ${eventsSnapshot.docs.length}`);
    
    eventsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      
      console.log(`Event ${index + 1}:`, {
        id: doc.id,
        title: data.title,
        date: startDate.toLocaleDateString('es-ES'),
        time: data.allDay ? 'All day' : startDate.toLocaleTimeString('es-ES'),
        assignedTo: data.assignedTo
      });
    });
    
    console.log('\n📋 CANONICAL TRUTH (from official PDF):');
    console.log('1. Holiday: Monday, June 23, 2025 (all day)');
    console.log('2. Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');
    console.log('3. Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
    
    return eventsSnapshot.docs.length;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
};

// STEP 2: Complete fix
const fixCalendarCompletely = async () => {
  console.log('🛠️ COMPLETE CALENDAR FIX STARTING...');
  
  try {
    // Import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyBE1RjPJb3_3kQ-qv6zG4PFsT1HKJB_VkY", 
      authDomain: "famapp-427714.firebaseapp.com",
      projectId: "famapp-427714",
      storageBucket: "famapp-427714.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };
    
    const app = initializeApp(firebaseConfig, 'calendar-fix');
    const db = getFirestore(app);
    
    // Delete all existing events
    console.log('🗑️ STEP 1: Deleting ALL existing events...');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    const deletePromises = eventsSnapshot.docs.map(eventDoc => 
      deleteDoc(doc(db, 'events', eventDoc.id))
    );
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${eventsSnapshot.docs.length} events`);
    
    // Add canonical events
    console.log('📅 STEP 2: Adding canonical events from official PDF...');
    
    const canonicalEvents = [
      {
        title: "Holiday (no hay clases)",
        startDate: new Date(2025, 5, 23), // Monday June 23
        endDate: new Date(2025, 5, 23),
        allDay: true,
        description: "School holiday - No classes",
        assignedTo: "Borja",
        category: "holiday"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 5, 24, 8, 30), // Tuesday June 24, 8:30 AM
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        description: "Academic meeting for Prekinder & Kinder parents",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education"
      },
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall", 
        startDate: new Date(2025, 6, 2, 8, 30), // Wednesday July 2, 8:30 AM
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        description: "Academic meeting for Year 1-4 parents",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education"
      }
    ];
    
    // Add each event
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
        createdBy: 'manual-fix-script'
      };
      
      await addDoc(collection(db, 'events'), eventData);
      console.log(`✅ Added: ${event.title} - ${event.startDate.toLocaleDateString('es-ES')}`);
    }
    
    console.log('\n🎉 CALENDAR COMPLETELY FIXED!');
    console.log('📅 Added 3 canonical events from official PDF');
    console.log('\n📋 CANONICAL EVENTS NOW IN DATABASE:');
    console.log('• Holiday: Monday, June 23, 2025 (all day)');
    console.log('• Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');
    console.log('• Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
    
    console.log('\n🔄 Please refresh the page to see the changes');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
};

// Make functions available
window.auditCalendarEvents = auditCalendarEvents;
window.fixCalendarCompletely = fixCalendarCompletely;

console.log('🔧 CALENDAR FIX SCRIPT LOADED!');
console.log('\nEXECUTE THESE COMMANDS:');
console.log('1. window.auditCalendarEvents() - See current state');
console.log('2. window.fixCalendarCompletely() - Fix everything');
console.log('\nCopy and paste each command into the console.');