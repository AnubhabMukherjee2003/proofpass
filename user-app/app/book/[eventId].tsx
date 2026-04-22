import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { bookTicket, EventItem, getEvent } from '@/lib/api';

export default function BookEventScreen() {
  const { token } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function run() {
      if (!eventId) return;
      try {
        const data = await getEvent(eventId);
        setEvent(data);
      } catch (e) {
        Alert.alert('Could not load event', (e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [eventId]);

  const parsedEventId = useMemo(() => Number(eventId), [eventId]);

  if (!token) {
    return <Redirect href="/login" />;
  }

  async function onBook() {
    if (!event || Number.isNaN(parsedEventId)) return;
    try {
      setBooking(true);
      const res = await bookTicket(token, parsedEventId, Number(event.price));
      Alert.alert('Booked', `Ticket #${res.ticketId}\nTx: ${res.txHash}`);
      router.replace('/(tabs)/explore');
    } catch (e) {
      Alert.alert('Booking failed', (e as Error).message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {event ? (
        <View style={styles.card}>
          <Text style={styles.name}>{event.name}</Text>
          <Text style={styles.meta}>{event.location}</Text>
          <Text style={styles.meta}>{new Date(event.date * 1000).toLocaleString()}</Text>
          <Text style={styles.price}>INR {event.price}</Text>
          <Text style={styles.capacity}>
            {event.ticketsSold}/{event.capacity} sold
          </Text>

          <Pressable style={styles.bookButton} onPress={onBook} disabled={booking}>
            <Text style={styles.bookText}>{booking ? 'Booking...' : 'Confirm Booking'}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 14,
  },
  loader: {
    marginTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    color: '#475569',
  },
  price: {
    color: '#0369a1',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  capacity: {
    color: '#64748b',
  },
  bookButton: {
    marginTop: 14,
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookText: {
    color: '#042f2e',
    fontWeight: '700',
  },
});