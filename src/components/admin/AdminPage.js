import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaUsers, FaMapMarkerAlt, FaCreditCard, FaCog, FaTimes, } from 'react-icons/fa';
import supabase from '../../supabase';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
const MeetupManagement = ({ onNavigate }) => (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Meetup Management" }), _jsx("p", { className: "text-gray-500", children: "This feature is under development." })] }));
const CreditsAdmin = ({ onNavigate }) => (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Credits Administration" }), _jsx("p", { className: "text-gray-500", children: "This feature is under development." })] }));
const SystemSettings = ({ onNavigate }) => (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "System Settings" }), _jsx("p", { className: "text-gray-500", children: "This feature is under development." })] }));
const AdminPage = ({ onClose }) => {
    const [currentSection, setCurrentSection] = useState('dashboard');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const checkAdminStatus = async () => {
            setIsLoading(true);
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
            if (error) {
                console.error('Error fetching admin status:', error);
                setIsAdmin(false);
            }
            else {
                setIsAdmin(profileData.is_admin || false);
            }
            setIsLoading(false);
        };
        checkAdminStatus();
    }, []);
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: _jsx(FaTachometerAlt, {}) },
        { id: 'users', label: 'Users', icon: _jsx(FaUsers, {}) },
        { id: 'meetups', label: 'Meetups', icon: _jsx(FaMapMarkerAlt, {}) },
        { id: 'credits', label: 'Credits', icon: _jsx(FaCreditCard, {}) },
        { id: 'settings', label: 'Settings', icon: _jsx(FaCog, {}) },
    ];
    const renderSection = () => {
        switch (currentSection) {
            case 'users':
                return _jsx(UserManagement, { onNavigate: setCurrentSection });
            case 'meetups':
                return _jsx(MeetupManagement, { onNavigate: setCurrentSection });
            case 'credits':
                return _jsx(CreditsAdmin, { onNavigate: setCurrentSection });
            case 'settings':
                return _jsx(SystemSettings, { onNavigate: setCurrentSection });
            default:
                return _jsx(Dashboard, { onNavigate: setCurrentSection });
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" }) }));
    }
    if (!isAdmin) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-50", children: _jsxs("div", { className: "p-8 bg-white rounded-lg shadow-md max-w-md w-full", children: [_jsx("h2", { className: "text-2xl font-bold text-red-600 mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-700 mb-6", children: "You don't have permission to access the admin area. Please contact an administrator if you believe this is a mistake." }), _jsx("button", { onClick: onClose, className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200", children: "Return to Homepage" })] }) }));
    }
    return (_jsxs("div", { className: "flex h-screen bg-gray-100", children: [_jsxs("div", { className: "w-64 bg-white shadow-md", children: [_jsx("div", { className: "p-4 border-b", children: _jsx("h1", { className: "text-xl font-bold text-blue-600", children: "MeetNow Admin" }) }), _jsx("nav", { className: "mt-6", children: _jsxs("ul", { children: [navItems.map(item => (_jsx("li", { className: "mb-2", children: _jsxs("button", { onClick: () => setCurrentSection(item.id), className: `flex items-center w-full px-4 py-2 text-left ${currentSection === item.id
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-100'}`, children: [_jsx("span", { className: "mr-3", children: item.icon }), item.label] }) }, item.id))), _jsx("li", { className: "mb-2", children: _jsxs("button", { onClick: onClose, className: "flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100", children: [_jsx("span", { className: "mr-3", children: _jsx(FaTimes, {}) }), "Return to Map"] }) })] }) })] }), _jsx("div", { className: "flex-1 overflow-auto", children: renderSection() })] }));
};
export default AdminPage;
//# sourceMappingURL=AdminPage.js.map