import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { arrowBack } from 'ionicons/icons';
import api from '../../services/api';
import { CreateEventRequest } from '../../types';
import './CreateEvent.css';

const CreateEvent: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    location: '',
    date: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    price: '',
    capacity: '',
    imageUrl: '',
  });

  const handleInputChange = (field: keyof CreateEventRequest, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setError('');
  };

  const handleDateChange = (dateString: string) => {
    // Convert ISO string to Unix timestamp
    const timestamp = Math.floor(new Date(dateString).getTime() / 1000);
    handleInputChange('date', timestamp);
  };

  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Price must be a positive number');
      return false;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setError('Capacity must be a positive number');
      return false;
    }
    if (formData.date <= Math.floor(Date.now() / 1000)) {
      setError('Event date must be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.createEvent(formData);
      if (response.data) {
        history.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/dashboard')}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create Event</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="create-event-content">
        <IonCard className="form-card">
          <IonCardContent>
            {error && (
              <div className="error-message">
                <IonText color="danger">{error}</IonText>
              </div>
            )}

            <IonItem>
              <IonLabel position="stacked">Event Name *</IonLabel>
              <IonInput
                placeholder="e.g., DevFest 2025"
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Location *</IonLabel>
              <IonInput
                placeholder="e.g., Kolkata"
                value={formData.location}
                onIonChange={(e) => handleInputChange('location', e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Event Date *</IonLabel>
              <input
                type="date"
                value={formatDateForInput(formData.date)}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Price (Wei) *</IonLabel>
              <IonInput
                type="number"
                placeholder="e.g., 1000000000000000"
                value={formData.price}
                onIonChange={(e) => handleInputChange('price', e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Capacity (Seats) *</IonLabel>
              <IonInput
                type="number"
                placeholder="e.g., 500"
                value={formData.capacity}
                onIonChange={(e) => handleInputChange('capacity', e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Image URL (Optional)</IonLabel>
              <IonInput
                placeholder="ipfs://... or https://..."
                value={formData.imageUrl}
                onIonChange={(e) => handleInputChange('imageUrl', e.detail.value)}
              />
            </IonItem>

            <div className="button-container">
              <IonButton
                expand="full"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                className="submit-button"
              >
                {loading ? <IonSpinner name="crescent" /> : 'Create Event'}
              </IonButton>
            </div>

            <IonText color="medium" className="info-text">
              <p>* Required fields. All prices are in Wei (1 ETH = 10^18 Wei).</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default CreateEvent;
