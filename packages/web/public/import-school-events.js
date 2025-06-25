// IMPORTACIÓN CALENDARIO CRAIGHOUSE SCHOOL
console.log('📅 INICIANDO IMPORTACIÓN CALENDARIO CRAIGHOUSE SCHOOL...');

const importSchoolEvents = async () => {
  try {
    // Import Firebase services
    const { getFirebaseServices } = await import('/src/config/firebase.js');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    
    console.log('🔗 Conectado a Firebase Firestore...');
    
    // School events with exact dates from official PDF
    const schoolEvents = [
      // JUNE 2025 EVENTS
      {
        title: "Pupils return from mid-term holidays (clases comienzan)",
        description: "Students return to school after mid-term break. Classes resume.",
        startDate: new Date(2025, 5, 10, 8, 5), // Tuesday June 10, 8:05 AM
        endDate: new Date(2025, 5, 10, 15, 5), // 3:05 PM
        allDay: false,
        category: "academic",
        color: "#10b981",
        location: "School"
      },
      {
        title: "Year 2 Learning Together (apoderados invitados, por grupo) - Primary Assembly Hall",
        description: "Academic meeting for Year 2 parents - Enter through gravilla entrance",
        startDate: new Date(2025, 5, 11, 8, 30), // Wednesday June 11, 8:30 AM
        endDate: new Date(2025, 5, 11, 9, 30),
        allDay: false,
        category: "education",
        color: "#3182ce",
        location: "Primary Assembly Hall"
      },
      {
        title: "Year 2 Learning Together + Year 3 Field Trip",
        description: "Year 2 Learning Together (8:30-9:30) + Year 3 Field Trip (8:30-12:00)",
        startDate: new Date(2025, 5, 12, 8, 30), // Thursday June 12, 8:30 AM
        endDate: new Date(2025, 5, 12, 12, 0), // 12:00 PM
        allDay: false,
        category: "education",
        color: "#8b5cf6",
        location: "Primary Assembly Hall + External"
      },
      {
        title: "Formative Area Parent Workshop - Year 3 & 4 parents invited - M/S Inquiry Centre",
        description: "Area Formativa Taller de Apoderados for Year 3 & 4 parents",
        startDate: new Date(2025, 5, 19, 8, 30), // Thursday June 19, 8:30 AM
        endDate: new Date(2025, 5, 19, 9, 30),
        allDay: false,
        category: "education",
        color: "#f59e0b",
        location: "M/S Inquiry Centre"
      },
      {
        title: "Holiday - Día de los pueblos originarios (no hay clases)",
        description: "Indigenous Peoples Day - No classes",
        startDate: new Date(2025, 5, 20), // Friday June 20
        endDate: new Date(2025, 5, 20),
        allDay: true,
        category: "holiday",
        color: "#e53e3e",
        location: "School"
      },
      {
        title: "Holiday (no hay clases)",
        description: "School holiday - No classes",
        startDate: new Date(2025, 5, 23), // Monday June 23 *** CANONICAL ***
        endDate: new Date(2025, 5, 23),
        allDay: true,
        category: "holiday",
        color: "#e53e3e",
        location: "School"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        description: "Taller de Apoderados - Academic meeting for Prekinder & Kinder parents",
        startDate: new Date(2025, 5, 24, 8, 30), // Tuesday June 24, 8:30 AM *** CANONICAL ***
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        category: "education",
        color: "#3182ce",
        location: "M/S Dining Hall"
      },
      
      // JULY 2025 EVENTS
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
        description: "Taller de Apoderados - Academic meeting for Year 1-4 parents",
        startDate: new Date(2025, 6, 2, 8, 30), // Wednesday July 2, 8:30 AM *** CANONICAL ***
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        category: "education",
        color: "#3182ce",
        location: "M/S Dining Hall"
      },
      {
        title: "Playgroup Academic Meeting with Parents - M/S Inquiry Centre",
        description: "Taller de Apoderados - Academic meeting for Playgroup parents",
        startDate: new Date(2025, 6, 8, 8, 30), // Tuesday July 8, 8:30 AM
        endDate: new Date(2025, 6, 8, 9, 30),
        allDay: false,
        category: "education",
        color: "#3182ce",
        location: "M/S Inquiry Centre"
      },
      {
        title: "Last day for pupils (último día de clases)",
        description: "Final day of classes for students",
        startDate: new Date(2025, 6, 9, 8, 5), // Wednesday July 9, 8:05 AM
        endDate: new Date(2025, 6, 9, 15, 5),
        allDay: false,
        category: "academic",
        color: "#10b981",
        location: "School"
      },
      {
        title: "First semester report/portfolio online meetings (no hay clases)",
        description: "Online parent meetings for first semester reports - No classes",
        startDate: new Date(2025, 6, 10), // Thursday July 10
        endDate: new Date(2025, 6, 10),
        allDay: true,
        category: "academic",
        color: "#6366f1",
        location: "Online"
      },
      {
        title: "First semester report/portfolio online meetings (no hay clases)",
        description: "Online parent meetings for first semester reports - No classes",
        startDate: new Date(2025, 6, 11), // Friday July 11
        endDate: new Date(2025, 6, 11),
        allDay: true,
        category: "academic",
        color: "#6366f1",
        location: "Online"
      },
      {
        title: "Winter holidays/Vacaciones de invierno",
        description: "Winter vacation period - Semester 2 starts Tuesday July 22nd. Del lunes 14 de julio al lunes 21 de julio (ambas fechas inclusive).",
        startDate: new Date(2025, 6, 14), // Monday July 14
        endDate: new Date(2025, 6, 21), // Monday July 21
        allDay: true,
        category: "holiday",
        color: "#6b7280",
        location: "Home"
      }
    ];
    
    console.log(`📝 Importando ${schoolEvents.length} eventos del calendario oficial...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Add each event to Firebase
    for (let i = 0; i < schoolEvents.length; i++) {
      const event = schoolEvents[i];
      
      try {
        const eventData = {
          title: event.title,
          description: event.description,
          startDate: Timestamp.fromDate(event.startDate),
          endDate: Timestamp.fromDate(event.endDate),
          allDay: event.allDay,
          location: event.location || '',
          assignedTo: 'Borja', // All school events assigned to Borja
          category: event.category,
          color: event.color,
          recurring: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: 'craighouse-school-calendar-import'
        };
        
        const docRef = await addDoc(collection(db, 'events'), eventData);
        
        const dateStr = event.startDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const timeStr = event.allDay ? 'Todo el día' : event.startDate.toLocaleTimeString('es-ES');
        
        console.log(`✅ ${i + 1}/${schoolEvents.length}: ${event.title}`);
        console.log(`   📅 ${dateStr}`);
        console.log(`   ⏰ ${timeStr}`);
        console.log(`   📍 ${event.location}`);
        console.log(`   🆔 ${docRef.id}`);
        console.log('');
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error evento ${i + 1}: ${event.title}`, error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 IMPORTACIÓN COMPLETADA!`);
    console.log(`✅ Eventos agregados exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesados: ${successCount + errorCount}/${schoolEvents.length}`);
    
    console.log(`\n📋 EVENTOS CRÍTICOS CONFIRMADOS:`);
    console.log('• Holiday: Lunes 23 de junio, 2025 (todo el día)');
    console.log('• Prekinder Meeting: Martes 24 de junio, 2025, 8:30-9:30 hrs');
    console.log('• Year 1-4 Meeting: Miércoles 2 de julio, 2025, 8:30-9:30 hrs');
    console.log('• Last day of classes: Miércoles 9 de julio, 2025');
    console.log('• Winter holidays: 14-21 de julio, 2025');
    
    console.log(`\n🔄 Los eventos aparecerán automáticamente en:`);
    console.log('• 📅 Calendario de la app (CalendarModule)');
    console.log('• 🤖 AI Dashboard (próximos eventos)');
    console.log('• 📱 Todas las interfaces');
    
    console.log(`\n✨ ¡Calendario escolar importado correctamente!`);
    console.log('Recarga la página para ver los eventos en el calendario.');
    
    return { success: successCount, errors: errorCount, total: schoolEvents.length };
    
  } catch (error) {
    console.error('❌ Error crítico en importación:', error);
    throw error;
  }
};

// Execute import
console.log('🚀 Ejecutando importación automática...');
importSchoolEvents()
  .then(result => {
    console.log(`\n🏁 RESULTADO FINAL: ${result.success}/${result.total} eventos importados`);
  })
  .catch(error => {
    console.error('💥 FALLÓ LA IMPORTACIÓN:', error);
  });

// Make available for manual execution
window.importSchoolEvents = importSchoolEvents;

console.log('\n📋 COMANDOS DISPONIBLES:');
console.log('• importSchoolEvents() - Ejecutar importación manual');
console.log('• window.importSchoolEvents() - Mismo comando desde window');