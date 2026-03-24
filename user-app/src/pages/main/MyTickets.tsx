import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';
import { Ticket } from '../../types';
import './MyTickets.css';

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'used'>('all');
  const history = useHistory();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, filterType]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await api.getTickets();
      if (response.data) {
        setTickets(response.data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (filterType !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === filterType);
    }

    setFilteredTickets(filtered);
  };

  const handleTicketTap = (ticketId: string) => {
    history.push(`/ticket/${ticketId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    const normalizedStatus = status || 'unknown';
    switch (normalizedStatus) {
      case 'active':
        return 'success';
      case 'used':
        return 'medium';
      case 'expired':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const getStatusBadge = (status?: string) => {
    const normalizedStatus = status || 'unknown';
    switch (normalizedStatus) {
      case 'active':
        return '✓ ACTIVE';
      case 'used':
        return '✓ USED';
      case 'expired':
        return '⟳ EXPIRED';
      default:
        return normalizedStatus.toUpperCase();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/explore" />
          </IonButtons>
          <IonTitle>My Tickets</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="my-tickets-content">
        <IonRefresher slot="fixed" onIonRefresh={(e) => {
          loadTickets();
          setTimeout(() => e.detail.complete(), 500);
        }}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Ticket Count */}
        <div className="ticket-count">
          <IonText>
            <h2>Total Tickets: {tickets.length}</h2>
          </IonText>
        </div>

        {/* Filter Segment */}
        <div className="filter-segment">
          <IonSegment
            value={filterType}
            onIonChange={(e) => setFilterType(e.detail.value as any)}
          >
            <IonSegmentButton value="all">
              <IonText>All</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="active">
              <IonText>Active</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="used">
              <IonText>Used</IonText>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty-state">
            <IonText>
              <h2>No Tickets</h2>
              <p>You haven't booked any tickets yet</p>
            </IonText>
          </div>
        ) : (
          <div className="tickets-list">
            {filteredTickets.map((ticket) => (
              <IonCard
                key={ticket.id}
                onClick={() => handleTicketTap(ticket.id)}
                className="ticket-card"
              >
                <IonCardContent>
                  <div className="ticket-header">
                    <div className="ticket-info">
                      <h3>{ticket.event?.name || 'Event'}</h3>
                      <p className="ticket-location">
                        📍 {ticket.event?.location || 'Location'}
                      </p>
                    </div>
                    <span className={`status-badge status-${ticket.status}`}>
                      {getStatusBadge(ticket.status)}
                    </span>
                  </div>

                  <div className="ticket-details">
                    <div className="ticket-detail-item">
                      <span className="label">📅 Date</span>
                      <span className="value">
                        {ticket.event ? formatDate(ticket.event.date) : '-'}
                      </span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="label">🎫 Ticket ID</span>
                      <span className="value">#{ticket.id.slice(0, 8)}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="label">💵 Price</span>
                      <span className="value">₹{ticket.price}</span>
                    </div>
                  </div>

                  {ticket.status === 'active' && (
                    <p className="ticket-action-hint">Tap to view QR code</p>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MyTickets;
