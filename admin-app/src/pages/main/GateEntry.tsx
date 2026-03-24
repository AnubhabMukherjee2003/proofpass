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
  IonButton,
  IonInput,
  IonText,
  IonSpinner,
  IonAlert,
  IonIcon,
  IonModal,
  IonLabel,
  IonItem,
} from '@ionic/react';
import { useState, useRef } from 'react';
import { scanCircle, camera } from 'ionicons/icons';
import api from '../../services/api';
import { EntryTicket } from '../../types';
import './GateEntry.css';

interface ScanResult {
  ticket: EntryTicket | null;
  error: string | null;
  showOtpModal: boolean;
  otpCode: string;
  verifying: boolean;
}

const GateEntry: React.FC = () => {
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult>({
    ticket: null,
    error: null,
    showOtpModal: false,
    otpCode: '',
    verifying: false,
  });
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setScanResult((prev) => ({
        ...prev,
        error: 'Unable to access camera',
      }));
      setScanning(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setScanning(false);
  };

  const handleManualScan = async () => {
    if (!manualInput.trim()) {
      setScanResult((prev) => ({
        ...prev,
        error: 'Please enter QR data or ticket ID',
      }));
      return;
    }

    try {
      const response = await api.scanQrCode(manualInput);
      if (response.data) {
        setScanResult((prev) => ({
          ...prev,
          ticket: response.data!.ticket,
          error: null,
          showOtpModal: response.data!.otpSent,
        }));
      }
    } catch (err: any) {
      setScanResult((prev) => ({
        ...prev,
        error: err?.response?.data?.message || 'Scan failed',
        ticket: null,
      }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!scanResult.ticket || !scanResult.otpCode) {
      setScanResult((prev) => ({
        ...prev,
        error: 'Please enter OTP',
      }));
      return;
    }

    setScanResult((prev) => ({ ...prev, verifying: true }));
    try {
      const response = await api.verifyOtp(scanResult.ticket.id, scanResult.otpCode);
      if (response.data?.success) {
        setScanResult((prev) => ({
          ...prev,
          error: null,
          showOtpModal: false,
          otpCode: '',
          verifying: false,
        }));
        // Show success and reset after 2 seconds
        setTimeout(() => {
          setScanResult((prev) => ({
            ...prev,
            ticket: null,
          }));
          setManualInput('');
        }, 2000);
      }
    } catch (err: any) {
      setScanResult((prev) => ({
        ...prev,
        error: err?.response?.data?.message || 'Verification failed',
        verifying: false,
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'used':
        return '#888';
      case 'expired':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Gate Entry</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="gate-entry-content">
        {/* Scanner Section */}
        <IonCard className="scanner-card">
          <IonCardContent>
            <h2>Scan QR Code</h2>

            {scanning ? (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', borderRadius: '8px' }}
                />
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={handleStopCamera}
                  style={{ marginTop: '12px' }}
                >
                  Stop Camera
                </IonButton>
              </div>
            ) : (
              <IonButton
                expand="block"
                color="primary"
                onClick={handleStartCamera}
              >
                <IonIcon slot="start" icon={camera} />
                Start Camera
              </IonButton>
            )}
          </IonCardContent>
        </IonCard>

        {/* Manual Entry Fallback */}
        <IonCard className="manual-entry-card">
          <IonCardContent>
            <h3>Manual Entry</h3>
            <p className="hint-text">Can't scan? Enter QR data or ticket ID</p>

            <div className="input-group">
              <IonInput
                placeholder="Paste QR data or enter ticket ID"
                value={manualInput}
                onIonChange={(e) => setManualInput(e.detail.value || '')}
              />
            </div>

            <IonButton
              expand="block"
              onClick={handleManualScan}
              disabled={!manualInput}
            >
              <IonIcon slot="start" icon={scanCircle} />
              Process Entry
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Error Display */}
        {scanResult.error && (
          <IonAlert
            isOpen={!!scanResult.error}
            message={scanResult.error}
            buttons={['OK']}
            onDidDismiss={() =>
              setScanResult((prev) => ({ ...prev, error: null }))
            }
          />
        )}

        {/* Ticket Display */}
        {scanResult.ticket && (
          <IonCard className="ticket-result-card">
            <IonCardContent>
              <div
                className="ticket-status"
                style={{
                  backgroundColor: getStatusColor(scanResult.ticket.status),
                }}
              >
                <p>{scanResult.ticket.status.toUpperCase()}</p>
              </div>

              <h3>{scanResult.ticket.eventName}</h3>
              <p className="ticket-id">ID: {scanResult.ticket.id}</p>
              <p className="user-phone">👤 {scanResult.ticket.userPhone}</p>

              {scanResult.ticket.status === 'active' && (
                <p className="otp-hint">
                  OTP has been sent to user's phone
                </p>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Last Scanned (placeholder) */}
        <IonCard className="last-scanned-card">
          <IonCardContent>
            <h3>Today's Stats</h3>
            <div className="stat-item">
              <span>Tickets Scanned</span>
              <span className="value">-</span>
            </div>
            <div className="stat-item">
              <span>Entry Confirmed</span>
              <span className="value">-</span>
            </div>
            <div className="stat-item">
              <span>Pending OTP</span>
              <span className="value">-</span>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* OTP Verification Modal */}
      <IonModal
        isOpen={scanResult.showOtpModal}
        onDidDismiss={() =>
          setScanResult((prev) => ({ ...prev, showOtpModal: false }))
        }
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Verify OTP</IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={() =>
                  setScanResult((prev) => ({
                    ...prev,
                    showOtpModal: false,
                  }))
                }
              >
                Close
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="otp-modal-content">
            <IonCard>
              <IonCardContent>
                <h3>Enter OTP</h3>
                <p className="otp-hint">
                  User received 6-digit OTP on their phone
                </p>

                <IonItem>
                  <IonLabel position="floating">OTP Code</IonLabel>
                  <IonInput
                    inputMode="numeric"
                    type="number"
                    placeholder="000000"
                    value={scanResult.otpCode}
                    onInput={(e: any) =>
                      setScanResult((prev) => ({
                        ...prev,
                        otpCode: ((e.target.value || '') as string)
                          .replace(/[^0-9]/g, '')
                          .slice(0, 6),
                      }))
                    }
                    clearInput={false}
                  />
                </IonItem>

                <div className="otp-actions">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() =>
                      setScanResult((prev) => ({
                        ...prev,
                        showOtpModal: false,
                      }))
                    }
                  >
                    Cancel
                  </IonButton>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={handleVerifyOtp}
                    disabled={
                      scanResult.otpCode.length !== 6 ||
                      scanResult.verifying
                    }
                  >
                    {scanResult.verifying ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      'Verify & Confirm Entry'
                    )}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default GateEntry;
