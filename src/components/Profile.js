import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
const Profile = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState(null);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [credits, setCredits] = useState(0);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error)
                throw error;
            setProfile(data);
            setUsername(data.username || '');
            setDisplayName(data.display_name || '');
            setBio(data.bio || '');
            setAvatarUrl(data.avatar_url || '');
            setCredits(data.credits || 0);
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            setError(null);
            setMessage(null);
            const updates = {
                username,
                display_name: displayName,
                bio,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select();
            if (error)
                throw error;
            setProfile(data[0]);
            setMessage('Profile updated successfully!');
        }
        catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile. Please try again.');
        }
        finally {
            setUpdating(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "loading", children: "Loading profile..." });
    }
    if (!user) {
        return _jsx("div", { className: "error", children: "Please sign in to view your profile." });
    }
    return (_jsxs("div", { className: "profile-container", children: [_jsx("h2", { children: "Your Profile" }), error && _jsx("div", { className: "error-message", children: error }), message && _jsx("div", { className: "success-message", children: message }), _jsxs("div", { className: "profile-info", children: [_jsxs("div", { className: "profile-credits", children: [_jsxs("h3", { children: ["Credits: ", credits] }), _jsx("p", { children: "Use credits to extend meetup durations and add premium features." })] }), _jsxs("form", { onSubmit: updateProfile, className: "profile-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "username", children: "Username" }), _jsx("input", { id: "username", type: "text", value: username, onChange: e => setUsername(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "displayName", children: "Display Name" }), _jsx("input", { id: "displayName", type: "text", value: displayName, onChange: e => setDisplayName(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "bio", children: "Bio" }), _jsx("textarea", { id: "bio", value: bio, onChange: e => setBio(e.target.value), rows: 4 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "avatarUrl", children: "Avatar URL" }), _jsx("input", { id: "avatarUrl", type: "text", value: avatarUrl, onChange: e => setAvatarUrl(e.target.value) }), avatarUrl && (_jsx("div", { className: "avatar-preview", children: _jsx("img", { src: avatarUrl, alt: "Avatar preview" }) }))] }), _jsx("button", { type: "submit", className: "btn-primary", disabled: updating, children: updating ? 'Updating...' : 'Update Profile' })] })] })] }));
};
export default Profile;
//# sourceMappingURL=Profile.js.map