import { Redirect, Route } from 'react-router-dom';
import { IonApp, setupIonicReact, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Verify from './pages/auth/Verify';

// Main Pages
import Explore from './pages/main/Explore';
import MyTickets from './pages/main/MyTickets';
import About from './pages/main/About';
import EventDetail from './pages/main/EventDetail';
import TicketDetail from './pages/main/TicketDetail';

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
  const { token } = useAuth();

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Auth Routes - No token required */}
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/verify">
          <Verify />
        </Route>

        {/* Main Routes - Token required */}
        <Route exact path="/explore">
          <Explore />
        </Route>
        <Route exact path="/explore/:eventId">
          <EventDetail />
        </Route>
        <Route exact path="/tickets">
          <MyTickets />
        </Route>
        <Route exact path="/ticket/:ticketId">
          <TicketDetail />
        </Route>
        <Route exact path="/about">
          <About />
        </Route>

        {/* Redirect Logic */}
        <Route exact path="/">
          <Redirect to={token ? '/explore' : '/login'} />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </IonApp>
);

export default App;
