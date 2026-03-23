import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ticketService, entryService, type Ticket } from '@/services/user';
import { handleApiError, getErrorMessage } from '@/utils/errors';
import { useAuth } from '@/context/AuthContext';

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await ticketService.getTicket(parseInt(id));
      setTicket(data);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `Check out my event ticket!\nTicket ID: ${ticket.ticketId}\nEvent: ${ticket.eventId}`,
        title: 'Share Ticket',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Ticket Details</Text>
        </View>

        <View style={styles.ticketBox}>
          <View style={styles.ticketContent}>
            <Text style={styles.ticketId}>TICKET #{ticket.ticketId}</Text>
            <Text style={styles.eventInfo}>Event ID: {ticket.eventId}</Text>
            <Text style={styles.phoneInfo}>Phone: {ticket.phone}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Price</Text>
              <Text style={styles.priceValue}>{formatPrice(ticket.price)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Currency</Text>
              <Text style={styles.value}>{ticket.currency}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Booked On</Text>
              <Text style={styles.value}>{formatDate(ticket.timestamp)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Transaction Hash</Text>
              <Text style={styles.hashValue}>{ticket.txHash.slice(0, 20)}...</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusSection}>
              <View style={[styles.statusBadge, styles.activeStatus]}>
                <Text style={styles.statusText}>✓ ACTIVE</Text>
              </View>
              <Text style={styles.statusMessage}>Your ticket is ready to use</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionText}>
            1. Go to the event venue at the scheduled time
          </Text>
          <Text style={styles.instructionText}>
            2. Show this ticket to the admin
          </Text>
          <Text style={styles.instructionText}>
            3. Admin will verify and grant entry
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButtonFooter}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  ticketBox: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  ticketContent: {
    padding: 20,
  },
  ticketId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 1,
  },
  eventInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phoneInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  hashValue: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeStatus: {
    backgroundColor: '#e6f7ff',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusMessage: {
    fontSize: 13,
    color: '#666',
  },
  instructions: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: 14,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 12,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonFooter: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
