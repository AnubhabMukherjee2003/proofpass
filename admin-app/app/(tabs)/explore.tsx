import { Redirect } from 'expo-router';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useState } from 'react';
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
  const { adminToken, isInitializing } = useAdminAuth();
  const [ticketId, setTicketId] = useState('');
  const [userToken, setUserToken] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [lastScan, setLastScan] = useState('');
  const [scanError, setScanError] = useState('');

  const parseScanPayload = useCallback((payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      const parsedTicketId = parsed.ticketId ?? parsed.id ?? parsed.ticket_id;
      const parsedToken = parsed.token ?? parsed.userToken ?? parsed.user_token;

      if (!parsedTicketId || !parsedToken) {
        return null;
      }

      return {
        ticketId: String(parsedTicketId),
        token: String(parsedToken),
      };
    } catch {
      return null;
    }
  }, []);

  const onBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (hasScanned) return;
    setHasScanned(true);
    setLastScan(result.data);
    setScanError('');

    const parsed = parseScanPayload(result.data);
    if (!parsed) {
      setScanError('QR does not include ticketId and token.');
      return;
    }

    setTicketId(parsed.ticketId);
    setUserToken(parsed.token);
    setScannerOpen(false);
    Alert.alert('QR scanned', 'Ticket details filled from QR.');
  }, [hasScanned, parseScanPayload]);

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

  async function onScan() {
    try {
      if (!ticketId.trim() || !userToken.trim()) {
        Alert.alert('Missing fields', 'Ticket ID and user token are required.');
        return;
      }
      setLoadingScan(true);
      const data = await scanTicket(ticketId.trim(), userToken.trim(), adminToken);
      setPhone(data.phone || '');
      const delivery = data.delivery || 'LOG_ONLY';
      setDeliveryInfo(delivery === 'SMS_SENT' ? 'Gate OTP sent by SMS to user phone.' : 'Gate OTP SMS not sent. Check backend logs or dev OTP response.');
      Alert.alert('Gate OTP generated', data.message || 'Proceed to OTP verification.');
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
        <Text style={styles.warning}>Use gate OTP from this scan step. Auth/login OTP will not work for entry.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Scan QR</Text>
          <Pressable
            style={styles.cameraBtn}
            onPress={async () => {
              if (!permission?.granted) {
                const next = await requestPermission();
                if (!next.granted) {
                  Alert.alert('Camera permission denied', 'Enable camera permission to scan QR codes.');
                  return;
                }
              }
              setHasScanned(false);
              setLastScan('');
              setScanError('');
              setScannerOpen((value) => !value);
            }}>
            <Text style={styles.cameraBtnText}>{scannerOpen ? 'Close Scanner' : 'Open Camera Scanner'}</Text>
          </Pressable>
          {permission?.granted === false ? (
            <Text style={styles.permissionText}>Camera permission is required to scan QR codes.</Text>
          ) : null}
          {scannerOpen ? (
            <View style={styles.cameraFrame}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraHint}>Align QR within the frame</Text>
              </View>
            </View>
          ) : null}
          {scannerOpen ? (
            <Pressable style={styles.retryBtn} onPress={() => setHasScanned(false)}>
              <Text style={styles.retryText}>Scan Again</Text>
            </Pressable>
          ) : null}
          {scanError ? <Text style={styles.permissionText}>{scanError}</Text> : null}
          {lastScan ? (
            <Text style={styles.debugText} numberOfLines={2}>
              Last scan: {lastScan}
            </Text>
          ) : null}
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
          {deliveryInfo ? <Text style={styles.info}>{deliveryInfo}</Text> : null}
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
  warning: {
    color: '#92400e',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 10,
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
  cameraBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cameraBtnText: {
    color: '#082f49',
    fontWeight: '700',
  },
  permissionText: {
    color: '#b91c1c',
    fontSize: 12,
  },
  cameraFrame: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#0f172a',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHint: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  debugText: {
    color: '#475569',
    fontSize: 11,
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
  info: {
    color: '#475569',
    fontSize: 12,
  },
});
