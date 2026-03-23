import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminEntryService } from '@/services/admin';
import { handleApiError, getErrorMessage } from '@/utils/errors';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function EntryVerificationScreen() {
  const router = useRouter();
  const { user } = useAdminAuth();
  const [step, setStep] = useState<'scan' | 'verify'>('scan');
  const [ticketId, setTicketId] = useState('');
  const [userToken, setUserToken] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScanTicket = async () => {
    if (!ticketId.trim() || !userToken.trim()) {
      Alert.alert('Error', 'Please enter ticket ID and user token');
      return;
    }

    setIsLoading(true);
    try {
      setError(null);
      const result = await adminEntryService.scanTicket(parseInt(ticketId), userToken);
      setScanResult(result);
      setPhone(result.phone);
      setStep('verify');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEntry = async () => {
    if (!phone.trim() || !otp.trim()) {
      Alert.alert('Error', 'Please enter phone and OTP');
      return;
    }

    setIsLoading(true);
    try {
      setError(null);
      const result = await adminEntryService.confirmEntry(phone, otp);
      Alert.alert('Success', '✅ Entry Granted!', [
        {
          text: 'OK',
          onPress: () => {
            setStep('scan');
            setTicketId('');
            setUserToken('');
            setPhone('');
            setOtp('');
            setScanResult(null);
          },
        },
      ]);
    } catch (err) {
      const apiError = handleApiError(err);
      Alert.alert('Verification Failed', getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Entry Verification</Text>
        <Text style={styles.userInfo}>Admin: {user?.username}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {step === 'scan' ? (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Scan QR Code</Text>
            <Text style={styles.stepDescription}>
              Scan the QR code on the user's ticket to get the ticket ID and user token
            </Text>

            <Text style={styles.label}>Ticket ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ticket ID"
              placeholderTextColor="#999"
              value={ticketId}
              onChangeText={setTicketId}
              keyboardType="number-pad"
              editable={!isLoading}
            />

            <Text style={styles.label}>User Token</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter user JWT token"
              placeholderTextColor="#999"
              value={userToken}
              onChangeText={setUserToken}
              multiline
              editable={!isLoading}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleScanTicket}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Scan & Proceed</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Verify OTP</Text>
            <Text style={styles.stepDescription}>
              User has received an OTP via SMS. Enter it to confirm entry.
            </Text>

            {scanResult && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Ticket ID: {scanResult.ticketId}</Text>
                <Text style={styles.infoLabel}>Phone: {scanResult.phone}</Text>
                <Text style={styles.infoLabel}>
                  OTP expires in: {scanResult.expiresIn}
                </Text>
                {scanResult.otp && (
                  <View style={styles.devNote}>
                    <Text style={styles.devLabel}>[DEV] OTP: {scanResult.otp}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              editable={false}
            />

            <Text style={styles.label}>One-Time Password</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleConfirmEntry}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm Entry</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setStep('scan');
                setTicketId('');
                setUserToken('');
                setScanResult(null);
              }}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Scan Another Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 4,
    fontWeight: '500',
  },
  devNote: {
    backgroundColor: '#fff9e6',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  devLabel: {
    fontSize: 12,
    color: '#ff6600',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
