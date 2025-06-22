// DIAGNÓSTICO COMPLETO DEL PIPELINE DE DATOS
// Este script diagnostica cada paso desde Firebase hasta AI

const diagnosticarPipelineCompleto = async () => {
  console.log('🔬 DIAGNÓSTICO COMPLETO DEL PIPELINE DE DATOS');
  console.log('============================================');
  
  try {
    // PASO 1: Verificar datos directos de Firebase
    console.log('\n📊 PASO 1: DATOS DIRECTOS DE FIREBASE');
    const { getFirebaseServices } = await import('../config/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    const eventosClaveFirebase = {};
    eventsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const title = data.title;
      
      if (title.includes('Holiday') && !title.includes('pueblos')) {
        eventosClaveFirebase.holiday = {
          titulo: title,
          fecha: data.startDate.toDate(),
          fechaTexto: data.startDate.toDate().toLocaleDateString('es-ES'),
          diaTexto: data.startDate.toDate().toLocaleDateString('es-ES', { weekday: 'long' }),
          allDay: data.allDay
        };
      }
      
      if (title.includes('Prekinder & Kinder')) {
        eventosClaveFirebase.prekinder = {
          titulo: title,
          fecha: data.startDate.toDate(),
          fechaTexto: data.startDate.toDate().toLocaleDateString('es-ES'),
          diaTexto: data.startDate.toDate().toLocaleDateString('es-ES', { weekday: 'long' }),
          hora: data.startDate.toDate().toLocaleTimeString('es-ES'),
          allDay: data.allDay
        };
      }
      
      if (title.includes('Year 1, 2, 3, 4')) {
        eventosClaveFirebase.year1234 = {
          titulo: title,
          fecha: data.startDate.toDate(),
          fechaTexto: data.startDate.toDate().toLocaleDateString('es-ES'),
          diaTexto: data.startDate.toDate().toLocaleDateString('es-ES', { weekday: 'long' }),
          hora: data.startDate.toDate().toLocaleTimeString('es-ES'),
          allDay: data.allDay
        };
      }
    });
    
    console.log('EVENTOS CLAVE EN FIREBASE:');
    console.table(eventosClaveFirebase);
    
    // PASO 2: Verificar datos del DataAggregationService
    console.log('\n📋 PASO 2: DATOS DEL DATA AGGREGATION SERVICE');
    const { DataAggregationService } = await import('/packages/shared/src/services/dataAggregationService.js');
    
    const dataService = new DataAggregationService();
    const familyData = await dataService.aggregateFamilyData();
    
    const eventosClaveAggregation = {};
    familyData.events.upcoming.forEach(event => {
      if (event.title.includes('Holiday') && !event.title.includes('pueblos')) {
        eventosClaveAggregation.holiday = {
          titulo: event.title,
          fecha: event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate),
          fechaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES'),
          diaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES', { weekday: 'long' })
        };
      }
      
      if (event.title.includes('Prekinder')) {
        eventosClaveAggregation.prekinder = {
          titulo: event.title,
          fecha: event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate),
          fechaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES'),
          diaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES', { weekday: 'long' }),
          hora: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleTimeString('es-ES')
        };
      }
      
      if (event.title.includes('Year 1, 2, 3, 4')) {
        eventosClaveAggregation.year1234 = {
          titulo: event.title,
          fecha: event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate),
          fechaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES'),
          diaTexto: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('es-ES', { weekday: 'long' }),
          hora: (event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)).toLocaleTimeString('es-ES')
        };
      }
    });
    
    console.log('EVENTOS CLAVE EN AGGREGATION SERVICE:');
    console.table(eventosClaveAggregation);
    
    // PASO 3: Comparar datos
    console.log('\n⚖️ PASO 3: COMPARACIÓN DE DATOS');
    
    const compararEventos = (firebase, aggregation, nombre) => {
      if (!firebase || !aggregation) {
        console.log(`❌ ${nombre}: Evento faltante en uno de los servicios`);
        return false;
      }
      
      const fechaIgual = firebase.fechaTexto === aggregation.fechaTexto;
      const diaIgual = firebase.diaTexto === aggregation.diaTexto;
      
      console.log(`${fechaIgual && diaIgual ? '✅' : '❌'} ${nombre}:`);
      console.log(`   Firebase: ${firebase.diaTexto}, ${firebase.fechaTexto}`);
      console.log(`   Aggregation: ${aggregation.diaTexto}, ${aggregation.fechaTexto}`);
      
      if (firebase.hora && aggregation.hora) {
        const horaIgual = firebase.hora === aggregation.hora;
        console.log(`   ${horaIgual ? '✅' : '❌'} Hora - Firebase: ${firebase.hora}, Aggregation: ${aggregation.hora}`);
      }
      
      return fechaIgual && diaIgual;
    };
    
    const holidayOK = compararEventos(eventosClaveFirebase.holiday, eventosClaveAggregation.holiday, 'Holiday');
    const prekinderOK = compararEventos(eventosClaveFirebase.prekinder, eventosClaveAggregation.prekinder, 'Prekinder');
    const year1234OK = compararEventos(eventosClaveFirebase.year1234, eventosClaveAggregation.year1234, 'Year 1-4');
    
    // PASO 4: Verificar fechas canónicas
    console.log('\n📅 PASO 4: FECHAS CANÓNICAS ESPERADAS');
    const fechasCanoniques = {
      holiday: { dia: 'lunes', fecha: '23/6/2025' },
      prekinder: { dia: 'martes', fecha: '24/6/2025', hora: '8:30' },
      year1234: { dia: 'miércoles', fecha: '2/7/2025', hora: '8:30' }
    };
    
    console.table(fechasCanoniques);
    
    // PASO 5: Resultado del diagnóstico
    console.log('\n🎯 RESULTADO DEL DIAGNÓSTICO:');
    
    if (holidayOK && prekinderOK && year1234OK) {
      console.log('✅ PIPELINE FUNCIONANDO CORRECTAMENTE');
      console.log('El problema debe estar en el AI Service o prompt');
    } else {
      console.log('❌ PROBLEMA EN EL PIPELINE DE DATOS');
      console.log('Los datos se corrompen entre Firebase y DataAggregationService');
    }
    
    return {
      firebase: eventosClaveFirebase,
      aggregation: eventosClaveAggregation,
      datosCorrectos: holidayOK && prekinderOK && year1234OK
    };
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
};

window.diagnosticarPipelineCompleto = diagnosticarPipelineCompleto;
console.log('🔬 Diagnóstico cargado. Ejecuta: window.diagnosticarPipelineCompleto()');