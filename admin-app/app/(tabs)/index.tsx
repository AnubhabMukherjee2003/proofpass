import { Redirect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { createEvent, getDashboard } from '@/lib/api';

type DashboardStats = {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  scannedToday: number;
};

export default function DashboardScreen() {
  const { adminToken, logout, isInitializing } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;
    try {
      setError(null);
      const data = await getDashboard(adminToken);
      setStats(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function parseEventDate(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return NaN;

    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }

    const parsedMs = Date.parse(trimmed);
    if (Number.isNaN(parsedMs)) {
      return NaN;
    }

    return Math.floor(parsedMs / 1000);
  }

  async function onCreateEvent() {
    if (!adminToken) return;

    const unixDate = parseEventDate(dateInput);
    const parsedCapacity = Number(capacity);

    if (
      !name.trim() ||
      !location.trim() ||
      !price.trim() ||
      !capacity.trim() ||
      Number.isNaN(unixDate)
    ) {
      Alert.alert(
        'Missing fields',
        'Name, location, date, price and capacity are required. Date can be unix seconds or ISO date string.'
      );
      return;
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      Alert.alert('Invalid capacity', 'Capacity must be a positive number.');
      return;
    }

    try {
      setCreating(true);
      await createEvent(
        {
          name: name.trim(),
          location: location.trim(),
          date: unixDate,
          price: price.trim(),
          capacity: parsedCapacity,
        },
        adminToken
      );

      Alert.alert('Event created', 'Event was submitted successfully.');
      setName('');
      setLocation('');
      setDateInput('');
      setPrice('');
      setCapacity('');
      setLoading(true);
      await loadDashboard();
    } catch (e) {
      Alert.alert('Create event failed', (e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!adminToken) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>Logout</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator style={styles.loader} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {stats ? (
          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.label}>Total Events</Text>
              <Text style={styles.value}>{stats.totalEvents}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Active Events</Text>
              <Text style={styles.value}>{stats.activeEvents}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Tickets Sold</Text>
              <Text style={styles.value}>{stats.totalTicketsSold}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Scanned Today</Text>
              <Text style={styles.value}>{stats.scannedToday}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Event</Text>
          <TextInput
            style={styles.input}
            placeholder="Event name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (unix seconds or ISO, e.g. 2026-05-10T18:30:00Z)"
            value={dateInput}
            onChangeText={setDateInput}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={styles.input}
            placeholder="Capacity"
            keyboardType="number-pad"
            value={capacity}
            onChangeText={setCapacity}
          />
          <Pressable style={styles.createButton} onPress={onCreateEvent} disabled={creating}>
            <Text style={styles.createButtonText}>{creating ? 'Creating...' : 'Create Event'}</Text>
          </Pressable>
          {creating ? <ActivityIndicator style={styles.loader} /> : null}
          <Text style={styles.helper}>Image upload is optional and can be added later in admin tools.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  content: {
    gap: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  logout: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 10,
  },
  grid: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  label: {
    color: '#475569',
  },
  value: {
    marginTop: 6,
    fontSize: 30,
    color: '#0f172a',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#14532d',
    fontWeight: '700',
  },
  helper: {
    color: '#64748b',
    fontSize: 12,
  },
});
