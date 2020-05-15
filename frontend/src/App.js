import React, { useState } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import AuthPage from './pages/Auth';
import BookingsPage from './pages/Bookings';
import EventsPage from './pages/Events';
import MainNavigation from './components/Navigation/MainNavigation';
import AuthContext from './context/auth-context';

import './App.css';

function App() {
  const [auth, setAuth] = useState({ token: null, userId: null });
  const { token, userId } = auth;

  const login = (token, userId, tokenExpiration) => {
    setAuth({ token, userId });
  };

  const logout = () => {
    setAuth({ token: null, userId: null });
  };

  return (
    <BrowserRouter>
      <>
        <AuthContext.Provider value={{ token, userId, login, logout }}>
          <MainNavigation />
          <main className="main-content">
            <Switch>
              {/* Token redirects */}
              {token && <Redirect from="/" to="/events" exact />}
              {token && <Redirect from="/auth" to="/events" exact />}

              {/* Routes */}
              {!token && <Route path="/auth" component={AuthPage} />}
              <Route path="/events" component={EventsPage} />
              {token && <Route path="/bookings" component={BookingsPage} />}

              {/* No token? redirect */}
              {!token && <Redirect to="/auth" exact />}
            </Switch>
          </main>
        </AuthContext.Provider>
      </>
    </BrowserRouter>
  );
}

export default App;
