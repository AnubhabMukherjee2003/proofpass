import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { getDashboard } from '@/lib/api';

type DashboardStats = {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  scannedToday: number;
};

export default function DashboardScreen() {
  const { adminToken, logout } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      if (!adminToken) return;
      try {
        const data = await getDashboard(adminToken);
        setStats(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [adminToken]);

  if (!adminToken) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    marginTop: 20,
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
});
