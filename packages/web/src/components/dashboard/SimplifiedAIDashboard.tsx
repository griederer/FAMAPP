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

  // Ensure AI service initialization
  useEffect(() => {
    const ensureAIService = async () => {
      try {
        console.log('🤖 Ensuring AI Service is initialized for Simplified Dashboard...');
        await initializeAIService();
        console.log('✅ AI Service ready for Simplified Dashboard');
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

**ESTRUCTURA REQUERIDA:**

**📋 TODOS PENDIENTES:**
- Analiza prioridades y urgencias
- Menciona el número total y destaca los 2-3 más importantes
- Identifica patrones o tendencias (si alguien está sobrecargado, tareas vencidas, etc.)

**📅 CALENDARIO PRÓXIMAS 2 SEMANAS:**
- Lista eventos cronológicamente con fechas exactas
- Identifica conflictos potenciales o días muy ocupados
- Menciona eventos escolares, citas importantes, y festividades
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