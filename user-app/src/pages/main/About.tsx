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
  IonText,
  IonButton,
  IonList,
  IonItem,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logOut, lockClosed, shield } from 'ionicons/icons';
import './About.css';

const About: React.FC = () => {
  const { logout, user } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/explore" />
          </IonButtons>
          <IonTitle>About ProofPass</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="about-content">
        {/* App Header */}
        <div className="about-header">
          <h1>ProofPass</h1>
          <p className="subtitle">Blockchain Ticketing</p>
          <p className="version">Version 1.0.0</p>
        </div>

        {/* How It Works */}
        <IonCard className="how-it-works-card">
          <IonCardContent>
            <h2>How It Works</h2>

            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Login</h3>
                <p>Enter your phone number and verify with OTP for secure access</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Browse Events</h3>
                <p>Explore upcoming events and check availability and pricing</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Book Ticket</h3>
                <p>Select your ticket and proceed to secure payment via Razorpay</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Get QR Code</h3>
                <p>Your ticket is minted on blockchain and secured with QR code</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Entry Verified</h3>
                <p>Show your QR at the gate, verify with OTP, and enjoy the event</p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* User Account */}
        <IonCard className="account-card">
          <IonCardContent>
            <h2>Your Account</h2>
            <IonList>
              <IonItem>
                <div>
                  <strong>Phone Number</strong>
                  <p>{user?.phone || 'Not logged in'}</p>
                </div>
              </IonItem>
              <IonItem>
                <div>
                  <strong>Account Status</strong>
                  <p>Active</p>
                </div>
              </IonItem>
              <IonItem>
                <div>
                  <strong>Registration Date</strong>
                  <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Security Info */}
        <IonCard className="security-card">
          <IonCardContent>
            <h2>Security & Privacy</h2>

            <div className="security-item">
              <IonIcon icon={shield} color="primary" />
              <div>
                <p className="security-title">Blockchain Secured</p>
                <p className="security-desc">Your tickets are secured on the blockchain network</p>
              </div>
            </div>

            <div className="security-item">
              <IonIcon icon={lockClosed} color="primary" />
              <div>
                <p className="security-title">Encrypted Data</p>
                <p className="security-desc">All data is encrypted with industry-standard protocols</p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Legal */}
        <div className="legal-section">
          <IonButton fill="clear" color="primary">
            Terms & Conditions
          </IonButton>
          <IonButton fill="clear" color="primary">
            Privacy Policy
          </IonButton>
          <IonButton fill="clear" color="primary">
            Contact Support
          </IonButton>
        </div>

        {/* Logout */}
        <div className="logout-section">
          <IonButton
            expand="block"
            color="danger"
            onClick={handleLogout}
          >
            <IonIcon slot="start" icon={logOut} />
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;
