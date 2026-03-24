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
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Verify.css';

const Verify: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const { verifyOtp, loading } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const phone = new URLSearchParams(location.search).get('phone');

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!phone) {
      setError('Phone number not found');
      return;
    }

    try {
      await verifyOtp(phone, otp);
      history.push('/explore');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (!phone) return;
    try {
      // Call sendOtp again through context
      setOtp('');
      setTimer(300);
      setCanResend(false);
      setError('');
    } catch (err) {
      setError('Failed to resend OTP');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!phone) {
    return (
      <IonPage>
        <IonContent className="verify-content">
          <div className="verify-container">
            <IonText color="danger">
              <p>Phone number not found. Please try logging in again.</p>
            </IonText>
            <IonButton onClick={() => history.push('/login')}>Back to Login</IonButton>
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
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Verify OTP</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="verify-content">
        <div className="verify-container">
          <IonCard className="verify-card">
            <IonCardContent>
              <h2>Enter OTP</h2>
              <p className="verify-subtitle">We've sent a 6-digit OTP to +91 {phone?.slice(-4)}</p>

              <div className="otp-input-group">
                <label>OTP Code</label>
                <IonInput
                  inputMode="numeric"
                  type="number"
                  placeholder="000000"
                  value={otp}
                  onInput={(e: any) => {
                    const value = (e.target.value || '') as string;
                    const numericOnly = value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(numericOnly);
                  }}
                  disabled={loading}
                  className="otp-input"
                  clearInput={false}
                />
              </div>

              <div className="timer-section">
                <IonText color="medium">
                  <p>OTP expires in: <strong>{formatTimer(timer)}</strong></p>
                </IonText>
              </div>

              {error && <IonAlert isOpen={!!error} message={error} buttons={['OK']} onDidDismiss={() => setError('')} />}

              <IonButton
                expand="block"
                color="primary"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Verify OTP'}
              </IonButton>

              {canResend ? (
                <IonButton expand="block" fill="outline" color="primary" onClick={handleResendOtp}>
                  Resend OTP
                </IonButton>
              ) : (
                <IonText color="medium" className="resend-text">
                  <p>You can resend OTP after {formatTimer(timer)}</p>
                </IonText>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Verify;
