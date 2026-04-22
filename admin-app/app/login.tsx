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

import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminLogin } from '@/lib/api';

export default function AdminLoginScreen() {
  const {
    adminToken,
    username,
    setUsername,
    password,
    setPassword,
    login,
  } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  if (adminToken) {
    return <Redirect href="/(tabs)" />;
  }

  async function onLogin() {
    try {
      if (!username.trim() || !password.trim()) {
        Alert.alert('Missing credentials', 'Enter username and password.');
        return;
      }
      setLoading(true);
      const data = await adminLogin(username.trim(), password);
      login(data.token);
    } catch (error) {
      Alert.alert('Admin login failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>ProofPass Admin</Text>
        <Text style={styles.subtitle}>Sign in to dashboard</Text>

        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={onLogin} disabled={loading}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        {loading ? <ActivityIndicator style={styles.loader} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#020617',
    padding: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d1d5db',
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    color: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#22d3ee',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#083344',
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
});