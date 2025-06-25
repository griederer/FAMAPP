// Script to verify current Firebase dates
console.log('🔍 VERIFICANDO FECHAS EN FIREBASE...');

const verifyDates = async () => {
  try {
    // Get Firebase from global window
    const { getFirebaseServices } = await import('/src/config/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    console.log('📊 EVENTOS EN FIREBASE:');
    console.log(`Total eventos: ${eventsSnapshot.docs.length}`);
    
    const events = [];
    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      
      events.push({
        id: doc.id,
        title: data.title,
        date: startDate,
        dayOfWeek: startDate.toLocaleDateString('es-ES', { weekday: 'long' }),
        dateString: startDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: data.allDay ? 'Todo el día' : startDate.toLocaleTimeString('es-ES'),
        allDay: data.allDay
      });
    });
    
    // Sort by date
    events.sort((a, b) => a.date - b.date);
    
    console.log('\n📅 EVENTOS ORDENADOS POR FECHA:');
    events.forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.title}`);
      console.log(`   📆 ${event.dateString}`);
      console.log(`   ⏰ ${event.time}`);
      console.log(`   ID: ${event.id}`);
    });
    
    // Check for the specific events we care about
    console.log('\n🔍 VERIFICACIÓN DE EVENTOS CRÍTICOS:');
    
    const holiday = events.find(e => e.title.toLowerCase().includes('holiday'));
    const prekinder = events.find(e => e.title.toLowerCase().includes('prekinder'));
    const year14 = events.find(e => e.title.toLowerCase().includes('year') && e.title.includes('1'));
    
    console.log('\nHoliday:');
    if (holiday) {
      console.log(`✅ Encontrado: ${holiday.dateString}`);
      console.log(`   Día de la semana: ${holiday.dayOfWeek}`);
      console.log(`   ¿Es Lunes 23 de junio? ${holiday.date.getDate() === 23 && holiday.date.getMonth() === 5 ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log('❌ No encontrado');
    }
    
    console.log('\nPrekinder Meeting:');
    if (prekinder) {
      console.log(`✅ Encontrado: ${prekinder.dateString}`);
      console.log(`   Día de la semana: ${prekinder.dayOfWeek}`);
      console.log(`   ¿Es Martes 24 de junio? ${prekinder.date.getDate() === 24 && prekinder.date.getMonth() === 5 ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log('❌ No encontrado');
    }
    
    console.log('\nYear 1-4 Meeting:');
    if (year14) {
      console.log(`✅ Encontrado: ${year14.dateString}`);
      console.log(`   Día de la semana: ${year14.dayOfWeek}`);
      console.log(`   ¿Es Miércoles 2 de julio? ${year14.date.getDate() === 2 && year14.date.getMonth() === 6 ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log('❌ No encontrado');
    }
    
    // Check what the AI would see
    console.log('\n🤖 DATOS QUE VE EL AI:');
    console.log('El AI debería recibir estos eventos upcoming (próximas 2 semanas):');
    
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = events.filter(e => e.date >= now && e.date <= twoWeeks);
    upcomingEvents.forEach(event => {
      console.log(`- ${event.title}: ${event.dateString}`);
    });
    
    return events;
    
  } catch (error) {
    console.error('❌ Error verificando fechas:', error);
  }
};

// Execute verification
verifyDates();

// Make available globally
window.verifyDates = verifyDates;

console.log('\n📋 Comando disponible: window.verifyDates()');