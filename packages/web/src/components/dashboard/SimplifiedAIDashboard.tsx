// Simplified AI Dashboard - Visual summary + Chat interface
import React, { useEffect, useState, useCallback } from 'react';
import { useAI } from '../../hooks/useAI';
import { useI18n } from '../../hooks/useI18n';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import type { AggregatedFamilyData, AIResponse } from '@famapp/shared';
import { initializeAIService } from '../../config/ai';
import { LoadingState } from '../ui/LoadingState';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ChatInterface } from './ChatInterface';
import './AIDashboard.css';
import './SimplifiedAIDashboard.css';

// Simple metrics interface
interface SimpleMetrics {
  todos: number;
  appointments: number;
  groceries: number;
}

// Component props
interface SimplifiedAIDashboardProps {
  className?: string;
}

// Main component
export const SimplifiedAIDashboard: React.FC<SimplifiedAIDashboardProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { generateSummary, isHealthy, isLoading: globalAiLoading, error: globalAiError } = useAI();
  
  // Real-time data hook
  const {
    familyData,
    isLoading: dataLoading,
    error: dataError,
    refresh
  } = useRealTimeData({
    enableAutoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Component state
  const [metrics, setMetrics] = useState<SimpleMetrics>({ todos: 0, appointments: 0, groceries: 0 });
  const [initialSummary, setInitialSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Ensure AI service initialization and load calendar fix script
  useEffect(() => {
    const ensureAIService = async () => {
      try {
        console.log('🤖 Ensuring AI Service is initialized for Simplified Dashboard...');
        await initializeAIService();
        console.log('✅ AI Service ready for Simplified Dashboard');
        
        // Load fresh start script for complete calendar reset
        try {
          const scriptResponse = await fetch('/src/scripts/freshStart.js');
          const scriptText = await scriptResponse.text();
          eval(scriptText);
          console.log('🔄 Fresh start script loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load fresh start script:', error);
          // Load inline calendar audit and fix functions
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
              
              console.log('\\n🔍 DUPLICATE/CONFLICT ANALYSIS:');
              Object.keys(eventsByTitle).forEach(title => {
                if (eventsByTitle[title].length > 1) {
                  console.log(`❌ CONFLICT - "${title}": ${eventsByTitle[title].length} versions`);
                  eventsByTitle[title].forEach((event, i) => {
                    console.log(`  Version ${i + 1}: ${event.dateString} ${event.allDay ? '(All day)' : event.timeString}`);
                  });
                }
              });
              
              console.log('\\n📋 CANONICAL TRUTH (from official PDF):');
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
                {
                  title: "Holiday (no hay clases)",
                  startDate: new Date(2025, 5, 23), // Monday June 23 *** CANONICAL ***
                  endDate: new Date(2025, 5, 23),
                  allDay: true,
                  description: "School holiday - No classes",
                  assignedTo: "Borja",
                  category: "holiday"
                },
                {
                  title: "Prekinder & Kinder Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
                  startDate: new Date(2025, 5, 24, 8, 30), // Tuesday June 24, 8:30 AM *** CANONICAL ***
                  endDate: new Date(2025, 5, 24, 9, 30),
                  allDay: false,
                  description: "Academic meeting for Prekinder & Kinder parents at M/S Dining Hall",
                  location: "M/S Dining Hall",
                  assignedTo: "Borja",
                  category: "education"
                },
                {
                  title: "Year 1, 2, 3, 4 Academic Meeting with Parents - M/S Dining Hall (Taller de Apoderados)",
                  startDate: new Date(2025, 6, 2, 8, 30), // Wednesday July 2, 8:30 AM *** CANONICAL ***
                  endDate: new Date(2025, 6, 2, 9, 30),
                  allDay: false,
                  description: "Academic meeting for Year 1-4 parents at M/S Dining Hall",
                  location: "M/S Dining Hall",
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
              
              console.log(`\\n🎉 CALENDAR COMPLETELY FIXED!`);
              console.log(`📅 Added ${canonicalEvents.length} canonical events from official PDF`);
              console.log('\\n📋 KEY EVENTS (CANONICAL TRUTH):');
              console.log('• Holiday: Monday, June 23, 2025 (all day)');
              console.log('• Prekinder Meeting: Tuesday, June 24, 2025 at 8:30-9:30 AM');  
              console.log('• Year 1-4 Meeting: Wednesday, July 2, 2025 at 8:30-9:30 AM');
              
              // Clear all caches and refresh
              console.log('🔄 Refreshing page to load clean data...');
              setTimeout(() => window.location.reload(), 3000);
              
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
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize AI Service for Simplified Dashboard:', error);
      }
    };
    
    ensureAIService();
  }, []);

  // Calculate simple metrics
  useEffect(() => {
    if (familyData) {
      const newMetrics: SimpleMetrics = {
        todos: familyData.todos.pending.length + familyData.todos.overdue.length,
        appointments: familyData.events.upcoming.length,
        groceries: familyData.groceries.pending.length + familyData.groceries.urgentItems.length
      };
      setMetrics(newMetrics);
    }
  }, [familyData]);

  // Generate initial summary
  const generateInitialSummary = useCallback(async (data: AggregatedFamilyData) => {
    if (!isHealthy || !data || isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    
    try {
      // Create a detailed context for initial summary using Sonnet 4's advanced capabilities
      const summaryPrompt = `
Eres un asistente familiar inteligente con acceso completo a los datos de planificación familiar. Analiza la información y genera un resumen estructurado, cálido y útil en español.

**CONTEXTO ACTUAL:**
- Hoy es domingo 22 de junio de 2025
- Los eventos están cargados directamente del PDF oficial del colegio Craighouse School
- FECHAS EXACTAS de eventos clave (del PDF oficial):
  * Holiday: Lunes 23 de junio, 2025 (todo el día)
  * Prekinder & Kinder Academic Meeting: Martes 24 de junio, 2025, 8:30-9:30 AM
  * Year 1-4 Academic Meeting: Miércoles 2 de julio, 2025, 8:30-9:30 AM
- TIPOS DE EVENTOS:
  * "Holiday" = feriado escolar (no hay clases)
  * "Academic Meeting" = reuniones con apoderados
  * Todos los horarios están en formato 24 horas según el PDF oficial

**ESTRUCTURA REQUERIDA:**

**📋 TODOS PENDIENTES:**
- Analiza prioridades y urgencias
- Menciona el número total y destaca los 2-3 más importantes
- Identifica patrones o tendencias (si alguien está sobrecargado, tareas vencidas, etc.)

**📅 CALENDARIO PRÓXIMAS 2 SEMANAS:**
- Lista eventos cronológicamente con fechas exactas
- IDENTIFICA CORRECTAMENTE el tipo de cada evento (feriado, reunión, cita, etc.)
- Separa claramente: FERIADOS vs REUNIONES ESCOLARES vs CITAS
- Identifica conflictos potenciales o días muy ocupados
- Da contexto sobre la carga de trabajo semanal

**🛒 GROCERIES PENDIENTES:**
- Organiza por urgencia y categorías lógicas
- Sugiere si hay patrones (comidas repetitivas, faltantes frecuentes)
- Identifica items críticos vs. opcionales

**TONO Y ESTILO:**
- Conversacional y amigable, como un amigo cercano de la familia
- Usa emojis ocasionales pero no en exceso
- Sé específico con nombres, fechas y números
- Ofrece insights útiles, no solo lista datos
- Termina con una observación positiva o sugerencia práctica

Analiza los datos profundamente y proporciona insights que realmente ayuden a la familia a organizarse mejor.
`;

      const aiResponse = await generateSummary(data);
      if (aiResponse) {
        setInitialSummary(aiResponse.content);
      }
    } catch (error) {
      console.error('Error generating initial summary:', error);
      setInitialSummary('¡Hola! Estoy aquí para ayudarte con tu planificación familiar. ¿Qué más quieres saber de tu planificación semanal?');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [isHealthy, generateSummary, isGeneratingSummary]);

  // Generate summary when data is available
  useEffect(() => {
    if (familyData && isHealthy && !initialSummary && !isGeneratingSummary) {
      generateInitialSummary(familyData);
    }
  }, [familyData, isHealthy, initialSummary, generateInitialSummary, isGeneratingSummary]);

  // Compute loading and error states
  const isLoading = dataLoading || globalAiLoading;
  const combinedError = dataError || globalAiError;

  // Render loading state
  if (isLoading) {
    return (
      <div className={`ai-dashboard ${className}`}>
        <LoadingState message="Cargando tu planificación familiar..." />
      </div>
    );
  }

  // Render error state
  if (combinedError) {
    return (
      <div className={`ai-dashboard ${className}`}>
        <ErrorMessage 
          message={`Error: ${combinedError}`}
        />
      </div>
    );
  }

  return (
    <div className={`ai-dashboard simplified ${className}`}>
      <div className="dashboard-header">
        <h2>📱 Tu Planificación Familiar</h2>
      </div>

      {/* Visual Summary - Simple metrics */}
      <div className="visual-summary">
        <div className="metric-card todos">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-number">{metrics.todos}</div>
            <div className="metric-label">Todos</div>
          </div>
        </div>

        <div className="metric-card appointments">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-number">{metrics.appointments}</div>
            <div className="metric-label">Citas</div>
          </div>
        </div>

        <div className="metric-card groceries">
          <div className="metric-icon">🛒</div>
          <div className="metric-content">
            <div className="metric-number">{metrics.groceries}</div>
            <div className="metric-label">Compras</div>
          </div>
        </div>
      </div>

      {/* Chat Interface with Initial Summary */}
      <div className="chat-section">
        {familyData && (
          <ChatInterface 
            familyData={familyData}
            initialMessage={initialSummary || '¡Hola! ¿Qué más quieres saber de tu planificación semanal?'}
            isGeneratingInitial={isGeneratingSummary}
            onDataRefresh={refresh}
            className="dashboard-chat"
          />
        )}
      </div>
    </div>
  );
};

export default SimplifiedAIDashboard;