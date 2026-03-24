import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonText,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonAvatar,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { informationCircle, logOut } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Event } from '../../types';
import './Explore.css';

const Explore: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Available' | 'Sold Out'>('all');
  const { logout, user } = useAuth();
  const history = useHistory();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchText, filterType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await api.getEvents();
      if (response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchText.toLowerCase()) ||
        event.location.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by availability
    if (filterType === 'Available') {
      filtered = filtered.filter((event) => event.ticketsSold < event.capacity);
    } else if (filterType === 'Sold Out') {
      filtered = filtered.filter((event) => event.ticketsSold >= event.capacity);
    }

    setFilteredEvents(filtered);
  };

  const handleEventTap = (eventId: number) => {
    history.push(`/explore/${eventId}`);
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const handleAbout = () => {
    history.push('/about');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAvailabilityPercent = (event: Event) => {
    return Math.round((event.ticketsSold / event.capacity) * 100);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>ProofPass</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAbout}>
              <IonIcon slot="icon-only" icon={informationCircle} />
            </IonButton>
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="explore-content">
        <IonRefresher slot="fixed" onIonRefresh={(e) => {
          loadEvents();
          setTimeout(() => e.detail.complete(), 500);
        }}>
          <IonRefresherContent />
        </IonRefresher>

        {/* User Info */}
        <div className="user-info">
          <IonText>
            <p>Welcome, {user?.phone}</p>
          </IonText>
          <IonButton
            color="secondary"
            onClick={() => history.push('/tickets')}
            size="small"
          >
            My Tickets
          </IonButton>
        </div>

        {/* Search Bar */}
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value || '')}
          placeholder="Search events..."
          debounce={300}
        />

        {/* Filter Segment */}
        <div className="filter-segment">
          <IonSegment
            value={filterType}
            onIonChange={(e) => setFilterType(e.detail.value as any)}
          >
            <IonSegmentButton value="all">
              <IonText>All</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="Available">
              <IonText>Available</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="Sold Out">
              <IonText>Sold Out</IonText>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <IonText>
              <h2>No Events Found</h2>
              <p>Try adjusting your filters or search</p>
            </IonText>
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.map((event) => (
              <IonCard key={event.eventId} onClick={() => handleEventTap(event.eventId)} className="event-card">
                <div className="event-image-container">
                  <img src={event.imageUrl || 'https://via.placeholder.com/400x200?text=Event'} alt={event.name} className="event-image" />
                </div>
                <IonCardContent>
                  <h2>{event.name}</h2>
                  <p className="event-location">📍 {event.location}</p>
                  <p className="event-date">📅 {formatDate(event.date)}</p>

                  <div className="progress-section">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${getAvailabilityPercent(event)}%` }}
                      />
                    </div>
                    <IonText color="medium" className="progress-text">
                      <small>
                        {event.ticketsSold}/{event.capacity} sold
                      </small>
                    </IonText>
                  </div>

                  <div className="event-footer">
                    <h3 className="event-price">{(BigInt(event.price) / BigInt(1e16)).toString()} Wei</h3>
                    {event.ticketsSold >= event.capacity && (
                      <span className="sold-out-badge">SOLD OUT</span>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Explore;
