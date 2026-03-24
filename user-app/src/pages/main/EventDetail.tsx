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
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonLabel,
  IonItem,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { share, bookmark } from 'ionicons/icons';
import api from '../../services/api';
import { Event } from '../../types';
import './EventDetail.css';

const EventDetail: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { eventId } = useParams<{ eventId: string }>();
  const history = useHistory();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await api.getEvent(eventId);
      if (response.data) {
        setEvent(response.data);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!event || event.ticketsSold >= event.capacity) return;
    setShowBooking(true);
  };

  const handleProceedToPayment = async () => {
    if (!event || !termsAccepted) return;

    setPaymentLoading(true);
    try {
      console.log('🎫 Booking Ticket with Event Data:', {
        eventId: event.eventId,
        eventName: event.name,
        price: event.price,
        capacity: event.capacity,
        ticketsSold: event.ticketsSold
      });
      
      // Call the bookTicket API with eventId and price (backend generates paymentId)
      // eventId is number, price is string so convert to number
      const response = await api.bookTicket(event.eventId, Number(event.price));
      
      if (response.data) {
        alert('Booking successful! Your ticket has been booked.');
        setShowBooking(false);
        setTermsAccepted(false);
        // Reload events or navigate to tickets
        history.push('/explore');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      alert(err?.response?.data?.message || 'Failed to book ticket. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!event) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-container">
            <IonText color="danger">
              <h2>Event not found</h2>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const isSoldOut = event.ticketsSold >= event.capacity;
  const availabilityPercent = (event.ticketsSold / event.capacity) * 100;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/explore" />
          </IonButtons>
          <IonTitle>Event Details</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon slot="icon-only" icon={share} />
            </IonButton>
            <IonButton>
              <IonIcon slot="icon-only" icon={bookmark} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="event-detail-content">
        {/* Event Image */}
        <div className="event-detail-image">
          <img src={event.imageUrl || 'https://via.placeholder.com/400x200?text=Event'} alt={event.name} />
        </div>

        {/* Event Info */}
        <div className="event-detail-info">
          <h1>{event.name}</h1>

          <div className="event-meta">
            <p className="event-location">📍 {event.location}</p>
            <p className="event-datetime">
              📅 {formatDate(event.date)} at {formatTime(event.date)}
            </p>
          </div>

          {/* No additional info available from contract */}

          {/* Availability */}
          <IonCard className="availability-card">
            <IonCardContent>
              <h3>Availability</h3>
              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${availabilityPercent}%` }}
                  />
                </div>
                <IonText color="medium">
                  <small>
                    {event.ticketsSold} / {event.capacity} tickets sold
                  </small>
                </IonText>
              </div>
              {isSoldOut ? (
                <IonText color="danger">
                  <h2>SOLD OUT</h2>
                </IonText>
              ) : (
                <IonText color="success">
                  <h3>{event.capacity - event.ticketsSold} tickets available</h3>
                </IonText>
              )}
            </IonCardContent>
          </IonCard>

          {/* Price */}
          <div className="price-section">
            <IonText>
              <p className="price-label">Price per ticket</p>
              <h2 className="price-value">{(BigInt(event.price) / BigInt(1e16)).toString()} Wei</h2>
            </IonText>
          </div>

          {/* Book Button */}
          <IonButton
            expand="block"
            color="primary"
            size="large"
            onClick={handleBookNow}
            disabled={isSoldOut}
          >
            {isSoldOut ? 'Sold Out' : 'Book Now'}
          </IonButton>
        </div>
      </IonContent>

      {/* Booking Modal */}
      <IonModal isOpen={showBooking} onDidDismiss={() => setShowBooking(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Confirm Booking</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowBooking(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="booking-modal-content">
            <IonCard>
              <IonCardContent>
                <h2>Order Summary</h2>

                <div className="summary-item">
                  <span>Event</span>
                  <span>{event.name}</span>
                </div>
                <div className="summary-item">
                  <span>Date</span>
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="summary-item">
                  <span>Location</span>
                  <span>{event.location}</span>
                </div>
                <div className="summary-item">
                  <span>Quantity</span>
                  <span>1</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item total">
                  <span>Total</span>
                  <span>₹{event.price}</span>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Terms & Conditions */}
            <div className="terms-section">
              <label>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span> I agree to Terms & Conditions</span>
              </label>
            </div>

            <div className="booking-actions">
              <IonButton expand="block" fill="outline" onClick={() => setShowBooking(false)}>
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                color="primary"
                onClick={handleProceedToPayment}
                disabled={!termsAccepted || paymentLoading}
              >
                {paymentLoading ? <IonSpinner name="crescent" /> : 'Proceed to Payment'}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default EventDetail;
