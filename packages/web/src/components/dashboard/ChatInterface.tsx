// Conversational AI Chat Interface for natural language queries
import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { useI18n } from '../../hooks/useI18n';
import { DataAggregationService, type AggregatedFamilyData, type ConversationMessage } from '@famapp/shared';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import './ChatInterface.css';

// Message types for the chat
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// Component props
interface ChatInterfaceProps {
  className?: string;
  familyData?: AggregatedFamilyData;
}

// Chat interface component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '', 
  familyData 
}) => {
  const { t } = useI18n();
  const { askQuestion, isHealthy, isLoading: aiLoading } = useAI();
  
  // Component state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFamilyData, setCurrentFamilyData] = useState<AggregatedFamilyData | null>(familyData || null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  
  // Refs for auto-scroll and focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Safely handle scrollIntoView for testing environments
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Load family data if not provided
  useEffect(() => {
    if (!currentFamilyData) {
      const loadFamilyData = async () => {
        try {
          const dataAggregationService = new DataAggregationService();
          const data = await dataAggregationService.aggregateFamilyData();
          setCurrentFamilyData(data);
        } catch (error) {
          console.error('Failed to load family data for chat:', error);
        }
      };
      loadFamilyData();
    }
  }, [currentFamilyData]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isHealthy || !currentFamilyData) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      // Convert chat messages to conversation history format
      const history: ConversationMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      // Get AI response with conversation history
      const response = await askQuestion(inputValue.trim(), currentFamilyData, history);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response?.content || t('chat.error.response'),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history
      const newHistory: ConversationMessage[] = [
        ...history,
        {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.timestamp
        },
        {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp
        }
      ];
      setConversationHistory(newHistory.slice(-10)); // Keep last 10 messages
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: t('chat.error.response'),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setConversationHistory([]);
  };
  
  // Suggested questions
  const suggestedQuestions = [
    t('chat.suggestions.todos'),
    t('chat.suggestions.events'),
    t('chat.suggestions.groceries'),
    t('chat.suggestions.productivity')
  ];
  
  // Handle suggestion click
  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };
  
  // If AI service is not healthy, show warning
  if (!isHealthy) {
    return (
      <div className={`chat-interface ${className}`}>
        <div className="chat-unavailable">
          <div className="unavailable-icon">🤖</div>
          <h3>{t('chat.unavailable.title')}</h3>
          <p>{t('chat.unavailable.description')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`chat-interface ${className}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <h3>{t('chat.title')}</h3>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={handleClearChat}
            variant="secondary"
            size="sm"
            className="clear-button"
          >
            {t('chat.clear')}
          </Button>
        )}
      </div>
      
      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-icon">🎯</div>
            <h4>{t('chat.welcome.title')}</h4>
            <p>{t('chat.welcome.description')}</p>
            
            {/* Suggested Questions */}
            <div className="suggested-questions">
              <h5>{t('chat.suggestions.title')}</h5>
              <div className="suggestions-grid">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type}`}
              >
                <div className="message-avatar">
                  {message.type === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.input.placeholder')}
            disabled={aiLoading || isTyping}
            className="chat-input"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || aiLoading || isTyping}
            className="send-button"
            variant="primary"
            aria-label="send"
          >
            {aiLoading || isTyping ? (
              <LoadingState size="sm" />
            ) : (
              <span className="send-icon">📤</span>
            )}
          </Button>
        </div>
        
        {/* Input hints */}
        <div className="input-hints">
          <span className="hint">
            {t('chat.input.hint')}
          </span>
        </div>
      </div>
    </div>
  );
};

// Export component
export default ChatInterface;