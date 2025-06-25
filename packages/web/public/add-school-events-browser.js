// Script para ejecutar en la consola del navegador de tu app
// Ve a https://famapp-e80ff.web.app/ y pega este código en la consola

console.log('📅 AGREGANDO EVENTOS ESCOLARES...');

const addSchoolEvents = async () => {
  try {
    // Import Firebase services from your app
    const { getFirebaseServices } = await import('/src/config/firebase.js');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    console.log('🔗 Conectado a Firebase...');
    
    // Eventos principales del colegio
    const events = [
      {
        title: "Holiday (no hay clases)",
        description: "School holiday - No classes",
        startDate: new Date(2025, 5, 23), // Monday June 23
        endDate: new Date(2025, 5, 23),
        allDay: true,
        location: "School",
        category: "holiday",
        color: "#e53e3e"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        description: "Taller de Apoderados - Academic meeting for Prekinder & Kinder parents",
        startDate: new Date(2025, 5, 24, 8, 30), // Tuesday June 24, 8:30 AM
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        location: "M/S Dining Hall",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
        description: "Taller de Apoderados - Academic meeting for Year 1-4 parents",
        startDate: new Date(2025, 6, 2, 8, 30), // Wednesday July 2, 8:30 AM
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        location: "M/S Dining Hall",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Playgroup Academic Meeting with Parents - M/S Inquiry Centre",
        description: "Taller de Apoderados - Academic meeting for Playgroup parents",
        startDate: new Date(2025, 6, 8, 8, 30), // Tuesday July 8, 8:30 AM
        endDate: new Date(2025, 6, 8, 9, 30),
        allDay: false,
        location: "M/S Inquiry Centre",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Last day for pupils (último día de clases)",
        description: "Final day of classes for students",
        startDate: new Date(2025, 6, 9, 8, 5), // Wednesday July 9, 8:05 AM
        endDate: new Date(2025, 6, 9, 15, 5),
        allDay: false,
        location: "School",
        category: "academic",
        color: "#10b981"
      }
    ];
    
    console.log(`📝 Agregando ${events.length} eventos...`);
    
    let success = 0;
    for (const event of events) {
      try {
        const eventData = {
          title: event.title,
          description: event.description,
          startDate: Timestamp.fromDate(event.startDate),
          endDate: Timestamp.fromDate(event.endDate),
          allDay: event.allDay,
          location: event.location,
          assignedTo: "Borja",
          category: event.category,
          color: event.color,
          recurring: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: "school-calendar-import"
        };
        
        const docRef = await addDoc(collection(db, 'events'), eventData);
        
        console.log(`✅ ${event.title}`);
        console.log(`   📅 ${event.startDate.toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}`);
        console.log(`   ⏰ ${event.allDay ? 'Todo el día' : event.startDate.toLocaleTimeString('es-ES')}`);
        console.log(`   🆔 ${docRef.id}`);
        console.log('');
        
        success++;
      } catch (error) {
        console.error(`❌ Error: ${event.title}`, error);
      }
    }
    
    console.log(`🎉 ¡${success} eventos agregados exitosamente!`);
    console.log('🔄 Los eventos aparecerán automáticamente en el calendario y AI Dashboard');
    console.log('💡 Recarga la página si no los ves inmediatamente');
    
    return success;
    
  } catch (error) {
    console.error('❌ Error crítico:', error);
  }
};

// Ejecutar automáticamente
addSchoolEvents();

// También disponible manualmente
window.addSchoolEvents = addSchoolEvents;

console.log('\n📋 COMANDO DISPONIBLE: addSchoolEvents()');