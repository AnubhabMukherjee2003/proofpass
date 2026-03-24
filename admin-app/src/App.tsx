import { Redirect, Route } from 'react-router-dom';
import { IonApp, setupIonicReact, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

// Auth Pages
import AdminLogin from './pages/auth/AdminLogin';

// Main Pages
import Dashboard from './pages/main/Dashboard';
import GateEntry from './pages/main/GateEntry';
import CreateEvent from './pages/main/CreateEvent';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { token } = useAdminAuth();

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Auth Route */}
        <Route exact path="/login">
          <AdminLogin />
        </Route>

        {/* Main Routes - Token required */}
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/create-event">
          <CreateEvent />
        </Route>
        <Route exact path="/gate-entry">
          <GateEntry />
        </Route>

        {/* Redirect Logic */}
        <Route exact path="/">
          <Redirect to={token ? '/dashboard' : '/login'} />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AdminAuthProvider>
      <AppRoutes />
    </AdminAuthProvider>
  </IonApp>
);

export default App;
