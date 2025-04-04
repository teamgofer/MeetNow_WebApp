import React, { useState, useEffect } from 'react';

import supabase from '../supabase';

const Auth = ({ onAuthChange }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('sign-in'); // 'sign-in' or 'sign-up'
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          if (onAuthChange) onAuthChange(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (onAuthChange) onAuthChange(session.user);
      } else {
        setUser(null);
        if (onAuthChange) onAuthChange(null);
      }
    });

    return () => {
      if (authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [onAuthChange]);

  const handleSignUp = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage('Check your email for the confirmation link!');
      setView('sign-in');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === 'sign-in' ? 'sign-up' : 'sign-in');
    setError(null);
    setMessage(null);
  };

  // If user is logged in, show profile and logout button
  if (user) {
    return (
      <div className="auth-container">
        <div className="user-info">
          <p>Logged in as {user.email}</p>
          <button className="btn-sign-out" onClick={handleSignOut} disabled={loading}>
            {loading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{view === 'sign-in' ? 'Sign In' : 'Sign Up'}</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? view === 'sign-in'
                  ? 'Signing In...'
                  : 'Signing Up...'
                : view === 'sign-in'
                  ? 'Sign In'
                  : 'Sign Up'}
            </button>

            <button type="button" className="btn-secondary" onClick={toggleView}>
              {view === 'sign-in' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
