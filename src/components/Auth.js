import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
const Auth = ({ onAuthChange }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null);
    const [view, setView] = useState('sign-in');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error, } = await supabase.auth.getSession();
                if (error)
                    throw error;
                if (session?.user) {
                    setUser(session.user);
                    if (onAuthChange)
                        onAuthChange(session.user);
                }
            }
            catch (error) {
                console.error('Error checking session:', error);
            }
        };
        checkSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
                if (onAuthChange)
                    onAuthChange(session.user);
            }
            else {
                setUser(null);
                if (onAuthChange)
                    onAuthChange(null);
            }
        });
        return () => {
            if (authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, [onAuthChange]);
    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error)
                throw error;
            setMessage('Check your email for the confirmation link!');
            setView('sign-in');
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw error;
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSignOut = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            setUser(null);
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleView = () => {
        setView(view === 'sign-in' ? 'sign-up' : 'sign-in');
        setError(null);
        setMessage(null);
    };
    if (user) {
        return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "user-info", children: [_jsxs("p", { children: ["Logged in as ", user.email] }), _jsx("button", { className: "btn-sign-out", onClick: handleSignOut, disabled: loading, children: loading ? 'Signing out...' : 'Sign out' })] }) }));
    }
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-form", children: [_jsx("h2", { children: view === 'sign-in' ? 'Sign In' : 'Sign Up' }), error && _jsx("div", { className: "error-message", children: error }), message && _jsx("div", { className: "success-message", children: message }), _jsxs("form", { onSubmit: view === 'sign-in' ? handleSignIn : handleSignUp, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", type: "password", value: password, onChange: e => setPassword(e.target.value), required: true })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "btn-primary", disabled: loading, children: loading
                                        ? view === 'sign-in'
                                            ? 'Signing In...'
                                            : 'Signing Up...'
                                        : view === 'sign-in'
                                            ? 'Sign In'
                                            : 'Sign Up' }), _jsx("button", { type: "button", className: "btn-secondary", onClick: toggleView, children: view === 'sign-in' ? 'Need an account? Sign Up' : 'Already have an account? Sign In' })] })] })] }) }));
};
export default Auth;
//# sourceMappingURL=Auth.js.map