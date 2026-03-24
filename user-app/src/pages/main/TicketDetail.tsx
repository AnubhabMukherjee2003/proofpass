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
  IonAlert,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { share, download, copy } from 'ionicons/icons';
import QRCode from 'qrcode.react';
import api from '../../services/api';
import { Ticket } from '../../types';
import './TicketDetail.css';

const TicketDetail: React.FC = () => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { ticketId } = useParams<{ ticketId: string }>();
  const history = useHistory();

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const response = await api.getTicket(ticketId);
      if (response.data) {
        setTicket(response.data);
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicketId = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQr = () => {
    const qrElement = document.getElementById('qr-code');
    if (qrElement) {
      const canvas = qrElement.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `ticket-${ticket?.id}.png`;
        link.click();
      }
    }
  };

  const handleShare = async () => {
    if (!ticket) return;
    const shareText = `I have a ticket for ${ticket.event?.name}. Ticket ID: ${ticket.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Event Ticket',
          text: shareText,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      await handleCopyTicketId();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '✓ VALID - Show at gate for entry';
      case 'used':
        return '✓ Used on ' + new Date().toLocaleDateString();
      case 'expired':
        return '⟳ EXPIRED';
      default:
        return status.toUpperCase();
    }
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

  if (!ticket) {
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
              <h2>Ticket not found</h2>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tickets" />
          </IonButtons>
          <IonTitle>Ticket Details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon slot="icon-only" icon={share} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ticket-detail-content">
        {/* Event Info Card */}
        <IonCard className="ticket-event-card">
          <div className="ticket-event-image">
            <img src={ticket.event?.imageUrl} alt={ticket.event?.name} />
          </div>
          <IonCardContent>
            <h1>{ticket.event?.name}</h1>
            <p className="event-location">📍 {ticket.event?.location}</p>
            <p className="event-date">
              📅 {ticket.event ? formatDate(ticket.event.date) : '-'}
            </p>
          </IonCardContent>
        </IonCard>

        {/* QR Code */}
        <IonCard className="qr-code-card">
          <IonCardContent>
            <div className="qr-container" id="qr-code">
              <QRCode
                value={ticket.qrCode}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <IonText color="medium" className="qr-hint">
              <p>Show this QR code at the gate for entry verification</p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Status */}
        <IonCard className="status-card">
          <IonCardContent>
            <div className={`status-badge status-${ticket.status}`}>
              {getStatusText(ticket.status)}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Ticket Info */}
        <IonCard className="ticket-info-card">
          <IonCardContent>
            <h3>Ticket Information</h3>

            <div className="info-item">
              <span className="label">Ticket ID</span>
              <span className="value">{ticket.id}</span>
            </div>

            <div className="info-item">
              <span className="label">Price Paid</span>
              <span className="value">₹{ticket.price}</span>
            </div>

            <div className="info-item">
              <span className="label">Booked On</span>
              <span className="value">
                {new Date(ticket.bookedAt * 1000).toLocaleDateString()}
              </span>
            </div>

            {ticket.usedAt && (
              <div className="info-item">
                <span className="label">Used On</span>
                <span className="value">
                  {new Date(ticket.usedAt * 1000).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="info-item">
              <span className="label">Transaction Hash</span>
              <span className="value hash">{ticket.transactionHash.slice(0, 16)}...</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Actions */}
        <div className="action-buttons">
          <IonButton expand="block" fill="outline" onClick={handleCopyTicketId}>
            <IonIcon slot="start" icon={copy} />
            {copied ? 'Copied!' : 'Copy Ticket ID'}
          </IonButton>

          <IonButton expand="block" fill="outline" onClick={handleDownloadQr}>
            <IonIcon slot="start" icon={download} />
            Download QR Code
          </IonButton>
        </div>

        {copied && (
          <IonAlert
            isOpen={copied}
            message="Ticket ID copied to clipboard!"
            buttons={['OK']}
            onDidDismiss={() => setCopied(false)}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default TicketDetail;
