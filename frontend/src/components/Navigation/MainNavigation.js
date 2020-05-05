import React from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../../context/auth-context';
import './MainNavigation.css';

const mainNavigation = props => (
  <AuthContext.Consumer>
    {(context) => {
      return (
        <header className="main-navigation">
          <div className="main-navigation__logo">
            <h1>Easy Event</h1>
          </div>
          <nav className="main-navigation__items">
            <ul>
              {/* Only render if unauthenticated (no token) */}
              {!context.token && (
                <li><NavLink to="/auth">Authenticate</NavLink></li>
              )}
              <li><NavLink to="/events">Events</NavLink></li>
              {/* Only render if authenticated (has token)  */}
              {context.token && (
                <>
                  <li><NavLink to="/bookings">Bookings</NavLink></li>
                  <button onClick={context.logout}>Logout</button>
                </>
              )}
            </ul>
          </nav>
        </header>
      );
    }}
  </AuthContext.Consumer>
);

export default mainNavigation;