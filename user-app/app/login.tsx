import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { sendOtp, verifyOtp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { token, phone, setPhone, login, isInitializing } = useAuth();
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  async function onSendOtp() {
    try {
      if (!phone.trim()) {
        Alert.alert('Phone required', 'Enter your phone in +91xxxxxxxxxx format.');
        return;
      }
      setLoading(true);
      await sendOtp(phone.trim());
      setOtpRequested(true);
      Alert.alert('OTP sent', 'Check your SMS or backend log in development.');
    } catch (error) {
      Alert.alert('Send OTP failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    try {
      if (!phone.trim() || !otp.trim()) {
        Alert.alert('Missing fields', 'Phone and OTP are required.');
        return;
      }
      setLoading(true);
      const data = await verifyOtp(phone.trim(), otp.trim());
      await login(data.token, phone.trim());
    } catch (error) {
      Alert.alert('Verify OTP failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>ProofPass</Text>
        <Text style={styles.subtitle}>Sign in with OTP</Text>

        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="+919123456789"
          autoCapitalize="none"
        />

        <Pressable style={styles.button} onPress={onSendOtp} disabled={loading}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </Pressable>

        {otpRequested && (
          <>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit OTP"
              maxLength={6}
            />
            <Pressable style={styles.button} onPress={onVerify} disabled={loading}>
              <Text style={styles.buttonText}>Verify & Login</Text>
            </Pressable>
          </>
        )}

        {loading ? <ActivityIndicator style={styles.loader} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#cbd5e1',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#082f49',
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
});