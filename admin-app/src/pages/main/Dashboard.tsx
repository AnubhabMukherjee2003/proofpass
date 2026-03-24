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
  IonText,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { logOut, addCircle, eye } from 'ionicons/icons';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../services/api';
import { Event, DashboardStats } from '../../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events'>('overview');
  const { logout, admin } = useAdminAuth();
  const history = useHistory();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getEvents(),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const handleCreateEvent = () => {
    history.push('/create-event');
  };

  const handleGateEntry = () => {
    history.push('/gate-entry');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dashboard-content">
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            loadDashboard();
            setTimeout(() => e.detail.complete(), 500);
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {/* Admin Info */}
        <div className="admin-info">
          <IonText>
            <p>Welcome, <strong>{admin?.username}</strong></p>
            <p className="role-badge">{admin?.role.replace('_', ' ').toUpperCase()}</p>
          </IonText>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <IonButton
            expand="block"
            color="success"
            onClick={handleCreateEvent}
          >
            <IonIcon slot="start" icon={addCircle} />
            Create Event
          </IonButton>
          <IonButton
            expand="block"
            color="primary"
            onClick={handleGateEntry}
          >
            <IonIcon slot="start" icon={eye} />
            Gate Entry
          </IonButton>
        </div>

        {/* Tab Selector */}
        <div className="filter-segment">
          <IonSegment
            value={selectedTab}
            onIonChange={(e) => setSelectedTab(e.detail.value as any)}
          >
            <IonSegmentButton value="overview">
              <IonText>Overview</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="events">
              <IonText>Events</IonText>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : selectedTab === 'overview' && stats ? (
          <div className="overview-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <IonCard className="stat-card">
                <IonCardContent>
                  <p className="stat-label">Total Events</p>
                  <h2 className="stat-value">{stats.totalEvents}</h2>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <p className="stat-label">Active Events</p>
                  <h2 className="stat-value">{stats.activeEvents}</h2>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <p className="stat-label">Total Tickets Sold</p>
                  <h2 className="stat-value">{stats.totalTicketsSold}</h2>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <p className="stat-label">Scanned Today</p>
                  <h2 className="stat-value">{stats.ticketsScannedToday}</h2>
                </IonCardContent>
              </IonCard>
            </div>

            {/* Recent Bookings */}
            <IonCard className="recent-card">
              <IonCardContent>
                <h3>Recent Bookings</h3>
                {stats.recentBookings.length === 0 ? (
                  <p className="empty-text">No recent bookings</p>
                ) : (
                  <div className="bookings-list">
                    {stats.recentBookings.map((booking, idx) => (
                      <div key={idx} className="booking-item">
                        <div>
                          <p className="booking-event">{booking.eventName}</p>
                          <small className="booking-time">
                            {new Date(booking.bookedAt * 1000).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="booking-price">₹{booking.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        ) : (
          <div className="events-section">
            {events.length === 0 ? (
              <div className="empty-state">
                <IonText>
                  <h2>No Events Created</h2>
                  <p>Create your first event to get started</p>
                </IonText>
              </div>
            ) : (
              <div className="events-list">
                {events.map((event) => (
                  <IonCard key={event.id} className="event-card">
                    <IonCardContent>
                      <div className="event-header">
                        <div>
                          <h3>{event.name}</h3>
                          <p className="event-location">📍 {event.location}</p>
                          <p className="event-date">📅 {formatDate(event.date)}</p>
                        </div>
                        <span className={`status-badge status-${event.status}`}>
                          {event.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="event-stats">
                        <div className="stat-item">
                          <span className="label">Price</span>
                          <span className="value">₹{event.price}</span>
                        </div>
                        <div className="stat-item">
                          <span className="label">Capacity</span>
                          <span className="value">
                            {event.sold}/{event.capacity}
                          </span>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
