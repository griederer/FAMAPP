// Calendar screen for FAMAPP mobile
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { calendarService } from '@famapp/shared';
import type { CalendarEvent } from '@famapp/shared';

export function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      const eventsData = await calendarService.getEvents(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      );
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventsByDate = () => {
    const eventsByDate: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = event.startDate.toDateString();
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    return Object.entries(eventsByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, events]) => ({
        date: new Date(date),
        events: events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      }));
  };

  const renderEvent = ({ item }: { item: CalendarEvent }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventTime}>
        <Text style={styles.eventTimeText}>
          {formatTime(item.startDate)}
        </Text>
        {item.endDate && (
          <Text style={styles.eventTimeText}>
            - {formatTime(item.endDate)}
          </Text>
        )}
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.eventDescription}>{item.description}</Text>
        )}
        <Text style={styles.eventMeta}>
          Creado por: {item.createdBy}
        </Text>
      </View>
    </View>
  );

  const renderDateSection = ({ item }: { item: { date: Date; events: CalendarEvent[] } }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateHeader}>
        {formatDate(item.date)}
      </Text>
      {item.events.map(event => (
        <View key={event.id} style={styles.eventItem}>
          <View style={styles.eventTime}>
            <Text style={styles.eventTimeText}>
              {formatTime(event.startDate)}
            </Text>
            {event.endDate && (
              <Text style={styles.eventTimeText}>
                - {formatTime(event.endDate)}
              </Text>
            )}
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
            <Text style={styles.eventMeta}>
              Creado por: {event.createdBy}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando eventos...</Text>
      </View>
    );
  }

  const eventsByDate = getEventsByDate();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {selectedDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
          })}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={eventsByDate}
        renderItem={renderDateSection}
        keyExtractor={item => item.date.toDateString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No hay eventos para este mes
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  listContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  eventTime: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 80,
  },
  eventTimeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
});