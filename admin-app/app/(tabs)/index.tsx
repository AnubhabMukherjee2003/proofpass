import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminEventService, type Event } from '@/services/admin';
import { handleApiError, getErrorMessage } from '@/utils/errors';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminEventsScreen() {
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      setError(null);
      const data = await adminEventService.listEvents();
      setEvents(data);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateEvent = () => {
    router.push('/event/create');
  };

  const handleEventDetails = (eventId: number) => {
    router.push(`/event/${eventId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseInt(price) / 100;
    return `₹${numPrice.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.userInfo}>Admin: {user?.username}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadEvents} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events created yet</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.eventId}
                style={styles.eventCard}
                onPress={() => handleEventDetails(event.eventId)}
              >
                {event.imageUrl && (
                  <Image
                    source={{ uri: event.imageUrl }}
                    style={styles.eventImage}
                  />
                )}
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        event.isActive ? styles.activeBadge : styles.inactiveBadge,
                      ]}
                    >
                      <Text style={styles.statusText}>{event.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventPrice}>{formatPrice(event.price)}</Text>
                    <Text style={styles.eventCapacity}>{event.capacity} seats</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateEvent}
      >
        <Text style={styles.createButtonText}>+ Create Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  userInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff9500',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  eventContent: {
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#e6f7ff',
  },
  inactiveBadge: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  eventLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  eventCapacity: {
    fontSize: 12,
    color: '#666',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

