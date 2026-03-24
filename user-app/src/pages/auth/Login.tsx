import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonAlert,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { sendOtp, loading } = useAuth();
  const history = useHistory();

  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit and non-plus characters
    const cleaned = input.replace(/[^0-9+]/g, '');
    
    // If starts with +91, return as is
    if (cleaned.startsWith('+91')) {
      return cleaned.slice(0, 13); // +91 + 10 digits
    }
    
    // If starts with 91, prepend +
    if (cleaned.startsWith('91')) {
      return '+' + cleaned.slice(0, 12);
    }
    
    // If just 10 digits, prepend +91
    if (cleaned.match(/^\d{10}$/)) {
      return '+91' + cleaned;
    }
    
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phone);
      await sendOtp(formattedPhone);
      history.push(`/verify?phone=${encodeURIComponent(formattedPhone)}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>ProofPass</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="login-content">
        <div className="login-container">
          <IonCard className="login-card">
            <IonCardContent>
              <h1 className="login-title">Login</h1>
              <p className="login-subtitle">Enter your phone number to get started</p>

              <div className="input-group">
                <label>Phone Number</label>
                <IonInput
                  type="tel"
                  placeholder="Enter phone number (e.g., +919876543210 or 9876543210)"
                  value={phone}
                  onIonChange={(e) => {
                    const value = e.detail.value || '';
                    // Allow digits, +, and limit length
                    const cleaned = value.replace(/[^0-9+]/g, '').slice(0, 13);
                    setPhone(cleaned);
                  }}
                  disabled={loading}
                  clearInput={false}
                />
              </div>

              {error && <IonAlert isOpen={!!error} message={error} buttons={['OK']} onDidDismiss={() => setError('')} />}

              <IonButton
                expand="block"
                color="primary"
                onClick={handleSendOtp}
                disabled={loading || !phone}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Send OTP'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          <p className="login-footer">
            Your phone number is used to verify your identity and secure your tickets
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
