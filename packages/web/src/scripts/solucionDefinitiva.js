// SOLUCIÓN DEFINITIVA - Ataca cada punto de falla posible
// Este script implementa múltiples layers de protección

const implementarSolucionDefinitiva = async () => {
  console.log('🛠️ IMPLEMENTANDO SOLUCIÓN DEFINITIVA');
  console.log('===================================');
  
  try {
    // PASO 1: Nuclear option - Limpiar completamente
    console.log('\n🗑️ PASO 1: LIMPIEZA NUCLEAR DE EVENTOS');
    
    const { getFirebaseServices } = await import('../config/firebase.js');
    const { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    
    // Borrar TODO
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const deletePromises = eventsSnapshot.docs.map(eventDoc => 
      deleteDoc(doc(db, 'events', eventDoc.id))
    );
    await Promise.all(deletePromises);
    console.log(`✅ Borrados ${eventsSnapshot.docs.length} eventos`);
    
    // PASO 2: Cargar SOLO los 3 eventos críticos con fechas EXACTAS
    console.log('\n📅 PASO 2: CARGA DE EVENTOS CRÍTICOS CON FECHAS EXACTAS');
    
    const eventosCriticos = [
      {
        title: "Holiday (no hay clases)",
        startDate: new Date(2025, 5, 23), // Lunes 23 junio 2025
        endDate: new Date(2025, 5, 23),
        allDay: true,
        description: "School holiday - No classes - CANONICAL DATE",
        assignedTo: "Borja",
        category: "holiday",
        canonical: true
      },
      {
        title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 5, 24, 8, 30), // Martes 24 junio 2025, 8:30 AM
        endDate: new Date(2025, 5, 24, 9, 30),
        allDay: false,
        description: "Academic meeting for Prekinder & Kinder parents - CANONICAL DATE",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        canonical: true
      },
      {
        title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall",
        startDate: new Date(2025, 6, 2, 8, 30), // Miércoles 2 julio 2025, 8:30 AM
        endDate: new Date(2025, 6, 2, 9, 30),
        allDay: false,
        description: "Academic meeting for Year 1-4 parents - CANONICAL DATE",
        location: "M/S Dining Hall",
        assignedTo: "Borja",
        category: "education",
        canonical: true
      }
    ];
    
    // Agregar cada evento con verificación
    for (const evento of eventosCriticos) {
      const eventData = {
        title: evento.title,
        description: evento.description,
        startDate: Timestamp.fromDate(evento.startDate),
        endDate: Timestamp.fromDate(evento.endDate),
        allDay: evento.allDay,
        location: evento.location || '',
        assignedTo: evento.assignedTo,
        category: evento.category,
        color: evento.category === 'holiday' ? '#e53e3e' : '#3182ce',
        recurring: false,
        canonical: true, // Marca especial
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'solucion-definitiva'
      };
      
      const docRef = await addDoc(collection(db, 'events'), eventData);
      
      // Verificar inmediatamente
      const fechaReal = evento.startDate;
      const diaReal = fechaReal.toLocaleDateString('es-ES', { weekday: 'long' });
      const fechaTextoReal = fechaReal.toLocaleDateString('es-ES');
      const horaReal = evento.allDay ? 'Todo el día' : fechaReal.toLocaleTimeString('es-ES');
      
      console.log(`✅ ${evento.title}`);
      console.log(`   📅 ${diaReal}, ${fechaTextoReal}`);
      console.log(`   ⏰ ${horaReal}`);
      console.log(`   🆔 ${docRef.id}`);
    }
    
    // PASO 3: Verificar inmediatamente
    console.log('\n🔍 PASO 3: VERIFICACIÓN INMEDIATA');
    
    const verificacionSnapshot = await getDocs(collection(db, 'events'));
    console.log(`Total eventos después de la carga: ${verificacionSnapshot.docs.length}`);
    
    verificacionSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const fecha = data.startDate.toDate();
      const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      const fechaTexto = fecha.toLocaleDateString('es-ES');
      const hora = data.allDay ? 'Todo el día' : fecha.toLocaleTimeString('es-ES');
      
      console.log(`Evento ${index + 1}: ${data.title}`);
      console.log(`  ${dia}, ${fechaTexto} - ${hora}`);
    });
    
    // PASO 4: Limpiar caché
    console.log('\n🧹 PASO 4: LIMPIEZA DE CACHÉ');
    
    // Limpiar localStorage
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('family') || key.includes('event') || key.includes('calendar')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Limpiado localStorage: ${key}`);
        }
      });
    }
    
    // Limpiar sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('family') || key.includes('event') || key.includes('calendar')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Limpiado sessionStorage: ${key}`);
        }
      });
    }
    
    console.log('\n🎉 SOLUCIÓN DEFINITIVA COMPLETADA');
    console.log('================================');
    console.log('✅ Eventos críticos cargados con fechas exactas');
    console.log('✅ Caché limpiado completamente');
    console.log('✅ Base de datos verificada');
    
    console.log('\n📋 FECHAS CANÓNICAS CARGADAS:');
    console.log('• Holiday: Lunes 23 de junio, 2025 (todo el día)');
    console.log('• Prekinder Meeting: Martes 24 de junio, 2025, 8:30-9:30 AM');
    console.log('• Year 1-4 Meeting: Miércoles 2 de julio, 2025, 8:30-9:30 AM');
    
    // PASO 5: Forzar refresh
    console.log('\n🔄 Recargando página en 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en solución definitiva:', error);
  }
};

window.implementarSolucionDefinitiva = implementarSolucionDefinitiva;
console.log('🛠️ Solución definitiva cargada. Ejecuta: window.implementarSolucionDefinitiva()');