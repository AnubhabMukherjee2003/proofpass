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
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminLogin.css';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAdminAuth();
  const history = useHistory();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      await login(username, password);
      history.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>ProofPass Admin</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="admin-login-content">
        <div className="admin-login-container">
          <IonCard className="admin-login-card">
            <IonCardContent>
              <h1 className="admin-login-title">Admin Login</h1>
              <p className="admin-login-subtitle">Gate Staff & Event Management</p>

              <div className="input-group">
                <label>Username</label>
                <IonInput
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onIonChange={(e) => setUsername(e.detail.value || '')}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <IonInput
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value || '')}
                  disabled={loading}
                />
              </div>

              {error && (
                <IonAlert isOpen={!!error} message={error} buttons={['OK']} onDidDismiss={() => setError('')} />
              )}

              <IonButton
                expand="block"
                color="primary"
                onClick={handleLogin}
                disabled={loading || !username || !password}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Login'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          <p className="admin-login-footer">
            For event management and gate entry verification
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminLogin;
