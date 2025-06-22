// SOLUCIÓN DIRECTA - Copia y pega esto completo en la consola

console.log('🛠️ INICIANDO SOLUCIÓN DIRECTA DEL CALENDARIO...');

// PASO 1: Borrar todos los eventos y cargar solo los 3 críticos
const solucionDirecta = async () => {
  try {
    console.log('📡 Conectando a Firebase...');
    
    // Obtener Firebase desde la ventana global
    const fb = window.firebase || await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const firestore = window.firestore || await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Usar la app existente
    const db = firestore.getFirestore();
    
    console.log('🗑️ Borrando TODOS los eventos existentes...');
    
    // Obtener y borrar todos los eventos
    const eventsSnapshot = await firestore.getDocs(firestore.collection(db, 'events'));
    console.log(`Encontrados ${eventsSnapshot.docs.length} eventos para borrar`);
    
    const deletePromises = eventsSnapshot.docs.map(doc => 
      firestore.deleteDoc(firestore.doc(db, 'events', doc.id))
    );
    await Promise.all(deletePromises);
    console.log('✅ Todos los eventos borrados');
    
    console.log('📅 Agregando SOLO los 3 eventos críticos con fechas EXACTAS...');
    
    // Los 3 eventos críticos con fechas EXACTAS
    const eventosExactos = [
      {
        title: "Holiday (no hay clases)",
        startDate: new Date(2025, 5, 23), // Lunes 23 junio
        endDate: new Date(2025, 5, 23),
        allDay: true,
        description: "School holiday - No classes",
        assignedTo: "Borja",
        category: "holiday",
        color: "#e53e3e"
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 5, 24, 8, 30), // Martes 24 junio, 8:30 AM
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        description: "Academic meeting for Prekinder & Kinder parents",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      },
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 6, 2, 8, 30), // Miércoles 2 julio, 8:30 AM
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        description: "Academic meeting for Year 1-4 parents",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        color: "#3182ce"
      }
    ];
    
    // Agregar cada evento
    for (const evento of eventosExactos) {
      const eventData = {
        title: evento.title,
        description: evento.description,
        startDate: firestore.Timestamp.fromDate(evento.startDate),
        endDate: firestore.Timestamp.fromDate(evento.endDate),
        allDay: evento.allDay,
        location: evento.location || '',
        assignedTo: evento.assignedTo,
        category: evento.category,
        color: evento.color,
        recurring: false,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        createdBy: 'solucion-directa-manual'
      };
      
      await firestore.addDoc(firestore.collection(db, 'events'), eventData);
      
      const fecha = evento.startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const hora = evento.allDay ? 'Todo el día' : evento.startDate.toLocaleTimeString('es-ES');
      
      console.log(`✅ ${evento.title}`);
      console.log(`   📅 ${fecha}`);
      console.log(`   ⏰ ${hora}`);
    }
    
    console.log('\n🎉 SOLUCIÓN COMPLETADA!');
    console.log('📋 EVENTOS CRÍTICOS CARGADOS:');
    console.log('• Holiday: Lunes 23 de junio, 2025 (todo el día)');
    console.log('• Prekinder Meeting: Martes 24 de junio, 2025, 8:30-9:30 AM');
    console.log('• Year 1-4 Meeting: Miércoles 2 de julio, 2025, 8:30-9:30 AM');
    
    console.log('\n🔄 Recargando página en 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en solución directa:', error);
    
    // Plan B: Solución manual simple
    console.log('\n🔧 PLAN B: Borrado manual con fetch...');
    
    try {
      // Intentar con fetch directo a la API
      const response = await fetch('/api/events/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            { title: "Holiday", date: "2025-06-23", allDay: true },
            { title: "Prekinder Meeting", date: "2025-06-24", time: "08:30" },
            { title: "Year 1-4 Meeting", date: "2025-07-02", time: "08:30" }
          ]
        })
      });
      
      if (response.ok) {
        console.log('✅ Plan B exitoso - recargando...');
        window.location.reload();
      } else {
        console.log('❌ Plan B falló - se necesita intervención manual');
      }
    } catch (fetchError) {
      console.log('❌ Plan B falló - se necesita intervención manual');
      console.log('💡 Solución: Usar la función debug disponible:');
      console.log('window.debugAuth.addBorjaEvents()');
    }
  }
};

// Ejecutar automáticamente
console.log('🚀 Ejecutando solución directa...');
solucionDirecta();

// También hacer disponible manualmente
window.solucionDirecta = solucionDirecta;

console.log('\n📋 COMANDOS DISPONIBLES:');
console.log('• solucionDirecta() - Ejecutar la solución completa');
console.log('• window.debugAuth.addBorjaEvents() - Agregar eventos usando función debug');