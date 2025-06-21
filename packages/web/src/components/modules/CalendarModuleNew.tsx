// Enhanced Calendar module with drag & drop and better event visualization
import { useState, useEffect, useMemo } from 'react';
import { eventService } from '@famapp/shared';
import type { CalendarEvent } from '@famapp/shared';

export function CalendarModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventColor, setEventColor] = useState('#3b82f6');

  // Calculate the first and last day of the current view
  const viewDates = useMemo(() => {
    if (viewMode === 'week') {
      // Week view: start of week to end of week
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      return { startDate, endDate };
    } else {
      // Month view: same as before
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Get the first day of the week for the first day of month
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      // Get the last day of the week for the last day of month
      const endDate = new Date(lastDayOfMonth);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      
      return { startDate, endDate, firstDayOfMonth, lastDayOfMonth };
    }
  }, [currentDate, viewMode]);

  // Subscribe to events for the current view
  useEffect(() => {
    setLoading(true);
    const unsubscribe = eventService.subscribeToEvents(
      viewDates.startDate,
      viewDates.endDate,
      (updatedEvents) => {
        setEvents(updatedEvents);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [viewDates]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(viewDates.startDate);
    
    while (current <= viewDates.endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [viewDates]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event management
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventAllDay(false);
    setEventColor('#3b82f6');
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDate(new Date(event.startDate));
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventAllDay(event.allDay);
    setEventColor(event.color || '#3b82f6');
    
    if (!event.allDay) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      setEventStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEventEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
    }
    
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !selectedDate) return;

    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      if (!eventAllDay) {
        const [startHour, startMin] = eventStartTime.split(':').map(Number);
        const [endHour, endMin] = eventEndTime.split(':').map(Number);
        startDate.setHours(startHour, startMin, 0, 0);
        endDate.setHours(endHour, endMin, 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const eventData: any = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        startDate,
        endDate,
        allDay: eventAllDay,
        color: eventColor,
      };

      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, eventData);
      } else {
        await eventService.createEvent(eventData);
      }

      setShowEventModal(false);
    } catch (err) {
      setError('Failed to save event');
      console.error('Error saving event:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      await eventService.deleteEvent(editingEvent.id);
      setShowEventModal(false);
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  // Drag and drop functions
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent) return;

    try {
      const newStartDate = new Date(targetDate);
      const newEndDate = new Date(targetDate);
      
      if (!draggedEvent.allDay) {
        // Preserve the time when moving
        const originalStart = new Date(draggedEvent.startDate);
        const originalEnd = new Date(draggedEvent.endDate);
        
        newStartDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
        newEndDate.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);
      } else {
        newStartDate.setHours(0, 0, 0, 0);
        newEndDate.setHours(23, 59, 59, 999);
      }

      await eventService.updateEvent(draggedEvent.id, {
        startDate: newStartDate,
        endDate: newEndDate,
      });

      setDraggedEvent(null);
    } catch (err) {
      setError('Failed to move event');
      console.error('Error moving event:', err);
    }
  };

  // Calculate hour position for timed events (percentage from top)
  const getEventPosition = (event: CalendarEvent) => {
    if (event.allDay) return 0;
    
    const startTime = new Date(event.startDate);
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    
    // Convert to percentage (0-100%) based on 24-hour day
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };


  // Calculate dynamic height for all-day events based on title length
  const getAllDayEventHeight = (title: string) => {
    const charCount = title.length;
    const wordsCount = title.split(' ').length;
    
    // Base height for padding and icon
    let height = 40;
    
    // Add height based on estimated lines needed
    const avgCharsPerLine = viewMode === 'week' ? 25 : 20;
    const estimatedLines = Math.ceil(charCount / avgCharsPerLine);
    
    // Add height per line (with generous spacing)
    height += estimatedLines * 22;
    
    // Minimum heights based on word count
    if (wordsCount <= 2) return Math.max(height, 50);
    if (wordsCount <= 4) return Math.max(height, 65);
    if (wordsCount <= 6) return Math.max(height, 80);
    if (wordsCount <= 8) return Math.max(height, 95);
    return Math.max(height, 110); // Very long titles
  };

  // Calculate dynamic height for timed events
  const getTimedEventHeight = (event: CalendarEvent) => {
    const title = event.title;
    const charCount = title.length;
    const wordsCount = title.split(' ').length;
    
    const startTime = new Date(event.startDate);
    const endTime = new Date(event.endDate);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    // Base height from duration
    const baseHeight = Math.max((durationMinutes / (24 * 60)) * 120, 60);
    
    // Calculate height based on title length
    let titleHeight = 45; // Base height for time display + padding
    
    // Add height based on estimated lines needed for title
    const avgCharsPerLine = viewMode === 'week' ? 22 : 18;
    const estimatedLines = Math.ceil(charCount / avgCharsPerLine);
    titleHeight += estimatedLines * 20; // Height per line
    
    // Minimum heights based on word count
    if (wordsCount <= 2) titleHeight = Math.max(titleHeight, 65);
    else if (wordsCount <= 4) titleHeight = Math.max(titleHeight, 80);
    else if (wordsCount <= 6) titleHeight = Math.max(titleHeight, 95);
    else if (wordsCount <= 8) titleHeight = Math.max(titleHeight, 110);
    else titleHeight = Math.max(titleHeight, 125);
    
    return Math.max(baseHeight, titleHeight);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Header Section */}
      <div style={{
        marginBottom: '32px',
        paddingTop: '32px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 8px 0',
              letterSpacing: '-0.025em',
            }}>
              {viewMode === 'month' 
                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : `Week of ${viewDates.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0',
            }}>
              Family events and scheduling • Drag events to move them
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* View Mode Buttons */}
            <div style={{ 
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '2px',
              marginRight: '12px',
            }}>
              <button 
                onClick={() => setViewMode('month')}
                style={{
                  backgroundColor: viewMode === 'month' ? 'white' : 'transparent',
                  color: viewMode === 'month' ? '#1f2937' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('week')}
                style={{
                  backgroundColor: viewMode === 'week' ? 'white' : 'transparent',
                  color: viewMode === 'week' ? '#1f2937' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Week
              </button>
            </div>

            <button 
              onClick={goToToday}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button 
              onClick={goToPrevious}
              style={{
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={goToNext}
              style={{
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
      }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid #e5e7eb',
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={{
              padding: '16px 8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: viewMode === 'week' ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        }}>
          {calendarDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const allDayEvents = dayEvents.filter(e => e.allDay);
            const timedEvents = dayEvents.filter(e => !e.allDay);
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = viewMode === 'week' || date.getMonth() === currentDate.getMonth();
            
            // Calculate dynamic height based on events
            const maxAllDayHeight = Math.max(...allDayEvents.map(e => getAllDayEventHeight(e.title)), 0);
            const maxTimedHeight = Math.max(...timedEvents.map(e => getTimedEventHeight(e)), 0);
            const minCellHeight = viewMode === 'week' ? 400 : 250;
            const calculatedHeight = Math.max(minCellHeight, maxAllDayHeight * allDayEvents.length + maxTimedHeight + 120);
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(date, e)}
                style={{
                  minHeight: `${calculatedHeight}px`,
                  padding: '12px',
                  border: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: isToday ? '#eff6ff' : isCurrentMonth ? 'white' : '#fafafa',
                  transition: 'background-color 0.2s',
                  position: 'relative',
                  overflow: 'visible',
                }}
                onMouseEnter={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.backgroundColor = isCurrentMonth ? 'white' : '#fafafa';
                  }
                }}
              >
                {/* Date Number */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: isToday ? '600' : '400',
                    color: isToday ? '#2563eb' : isCurrentMonth ? '#1f2937' : '#9ca3af',
                  }}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: '#e5e7eb',
                      color: '#6b7280',
                      padding: '2px 6px',
                      borderRadius: '10px',
                    }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* All Day Events - Full width bars at top */}
                <div style={{ marginBottom: '8px' }}>
                  {allDayEvents.slice(0, viewMode === 'week' ? 5 : 3).map((event) => {
                    const dynamicHeight = getAllDayEventHeight(event.title);
                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onClick={(e) => handleEventClick(event, e)}
                        style={{
                          width: '100%',
                          fontSize: viewMode === 'week' ? '14px' : '13px',
                          padding: '12px 14px',
                          backgroundColor: event.color || '#3b82f6',
                          color: 'white',
                          borderRadius: '8px',
                          marginBottom: '6px',
                          overflow: 'visible',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          cursor: 'grab',
                          fontWeight: '600',
                          lineHeight: '1.4',
                          minHeight: `${dynamicHeight}px`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        title={event.title} // Tooltip for full title
                      >
                        <span style={{ marginRight: '8px', fontSize: '16px', flexShrink: 0 }}>📅</span>
                        <span style={{ flex: 1 }}>{event.title}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Timed Events - Positioned by time */}
                <div style={{ 
                  position: 'relative', 
                  height: `${maxTimedHeight || 150}px`,
                  marginTop: '8px',
                }}>
                  {timedEvents.slice(0, viewMode === 'week' ? 4 : 2).map((event) => {
                    const eventHeight = getTimedEventHeight(event);
                    const areaHeight = maxTimedHeight || 150;
                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onClick={(e) => handleEventClick(event, e)}
                        style={{
                          position: 'absolute',
                          top: `${(getEventPosition(event) / 100) * areaHeight}px`,
                          left: '0',
                          width: '100%',
                          height: `${eventHeight}px`,
                          fontSize: viewMode === 'week' ? '13px' : '12px',
                          padding: '10px 12px',
                          backgroundColor: event.color || '#3b82f6',
                          color: 'white',
                          borderRadius: '8px',
                          overflow: 'visible',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          cursor: 'grab',
                          border: '1px solid rgba(255,255,255,0.2)',
                          lineHeight: '1.4',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          zIndex: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        title={`${new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${event.title}`}
                      >
                        <div style={{ 
                          fontSize: viewMode === 'week' ? '12px' : '11px', 
                          opacity: '0.9',
                          marginBottom: '6px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}>
                          🕐 {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div style={{ 
                          fontSize: viewMode === 'week' ? '13px' : '12px',
                          fontWeight: '600',
                          overflow: 'visible',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          flex: 1,
                        }}>
                          {event.title}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* More events indicator */}
                {(() => {
                  const maxAllDay = viewMode === 'week' ? 5 : 3;
                  const maxTimed = viewMode === 'week' ? 4 : 2;
                  const shownEvents = Math.min(allDayEvents.length, maxAllDay) + Math.min(timedEvents.length, maxTimed);
                  const totalEvents = dayEvents.length;
                  
                  return totalEvents > shownEvents && (
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      textAlign: 'center',
                      marginTop: '8px',
                      backgroundColor: '#f3f4f6',
                      padding: '6px 10px',
                      borderRadius: '12px',
                      fontWeight: '500',
                    }}>
                      +{totalEvents - shownEvents} more
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal - Same as before */}
      {showEventModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
            onClick={() => setShowEventModal(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            zIndex: 50,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h2>

            {/* Event Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Event Title
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Event Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Description (optional)
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Add description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* All Day Toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={eventAllDay}
                  onChange={(e) => setEventAllDay(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>All day event</span>
              </label>
            </div>

            {/* Time Selection */}
            {!eventAllDay && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Color Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Color
              </label>
              <input
                type="color"
                value={eventColor}
                onChange={(e) => setEventColor(e.target.value)}
                style={{
                  width: '50px',
                  height: '38px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {editingEvent && (
                <button
                  onClick={handleDeleteEvent}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginRight: 'auto',
                  }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}