import { Redirect } from 'expo-router';
import React, { useState } from 'react';
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
import { confirmEntry, scanTicket } from '@/lib/api';

export default function TicketCheckScreen() {
  const { adminToken } = useAdminAuth();
  const [ticketId, setTicketId] = useState('');
  const [userToken, setUserToken] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  if (!adminToken) {
    return <Redirect href="/login" />;
  }

  async function onScan() {
    try {
      if (!ticketId.trim() || !userToken.trim()) {
        Alert.alert('Missing fields', 'Ticket ID and user token are required.');
        return;
      }
      setLoadingScan(true);
      const data = await scanTicket(ticketId.trim(), userToken.trim(), adminToken);
      setPhone(data.phone || '');
      Alert.alert('OTP generated', data.message || 'Proceed to OTP verification.');
      if (data.otp) {
        setOtp(data.otp);
      }
    } catch (e) {
      Alert.alert('Scan failed', (e as Error).message);
    } finally {
      setLoadingScan(false);
    }
  }

  async function onConfirm() {
    try {
      if (!ticketId.trim() || !phone.trim() || !otp.trim()) {
        Alert.alert('Missing fields', 'Ticket ID, phone, and OTP are required.');
        return;
      }
      setLoadingConfirm(true);
      const data = await confirmEntry(ticketId.trim(), phone.trim(), otp.trim(), adminToken);
      Alert.alert('Entry granted', data.status || 'Ticket verified.');
      setOtp('');
      setUserToken('');
      setTicketId('');
    } catch (e) {
      Alert.alert('Verify failed', (e as Error).message);
    } finally {
      setLoadingConfirm(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ticket Checking</Text>
        <Text style={styles.subtitle}>QR scan + OTP verification</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Scan QR</Text>
          <TextInput
            style={styles.input}
            placeholder="Ticket ID"
            keyboardType="number-pad"
            value={ticketId}
            onChangeText={setTicketId}
          />
          <TextInput
            style={styles.input}
            placeholder="User token from QR"
            value={userToken}
            onChangeText={setUserToken}
            autoCapitalize="none"
            multiline
          />
          <Pressable style={styles.scanBtn} onPress={onScan} disabled={loadingScan}>
            <Text style={styles.scanText}>Scan & Generate OTP</Text>
          </Pressable>
          {loadingScan ? <ActivityIndicator style={styles.loader} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Enter OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
          <Pressable style={styles.confirmBtn} onPress={onConfirm} disabled={loadingConfirm}>
            <Text style={styles.confirmText}>Verify OTP & Grant Entry</Text>
          </Pressable>
          {loadingConfirm ? <ActivityIndicator style={styles.loader} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 14,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
  },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scanBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  scanText: {
    color: '#0c4a6e',
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmText: {
    color: '#14532d',
    fontWeight: '700',
  },
  loader: {
    marginTop: 4,
  },
});
