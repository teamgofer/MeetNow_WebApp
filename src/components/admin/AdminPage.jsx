import React, { useState, useEffect } from 'react';
import {
  FaTachometerAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCog,
  FaTimes,
} from 'react-icons/fa';

import supabase from '../../supabase';

import Dashboard from './Dashboard';
import UserManagement from './UserManagement';

// Placeholder components for sections we haven't built yet
const MeetupManagement = ({ onNavigate }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Meetup Management</h2>
    <p className="text-gray-500">This feature is under development.</p>
  </div>
);

const CreditsAdmin = ({ onNavigate }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Credits Administration</h2>
    <p className="text-gray-500">This feature is under development.</p>
  </div>
);

const SystemSettings = ({ onNavigate }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">System Settings</h2>
    <p className="text-gray-500">This feature is under development.</p>
  </div>
);

const AdminPage = ({ onClose }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user has admin privileges
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(profileData.is_admin || false);
      }

      setIsLoading(false);
    };

    checkAdminStatus();
  }, []);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'meetups', label: 'Meetups', icon: <FaMapMarkerAlt /> },
    { id: 'credits', label: 'Credits', icon: <FaCreditCard /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  // Render the appropriate component based on currentSection
  const renderSection = () => {
    switch (currentSection) {
      case 'users':
        return <UserManagement onNavigate={setCurrentSection} />;
      case 'meetups':
        return <MeetupManagement onNavigate={setCurrentSection} />;
      case 'credits':
        return <CreditsAdmin onNavigate={setCurrentSection} />;
      case 'settings':
        return <SystemSettings onNavigate={setCurrentSection} />;
      default:
        return <Dashboard onNavigate={setCurrentSection} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Non-admin users are redirected or shown an error message
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">
            You don't have permission to access the admin area. Please contact an administrator if
            you believe this is a mistake.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">MeetNow Admin</h1>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map(item => (
              <li key={item.id} className="mb-2">
                <button
                  onClick={() => setCurrentSection(item.id)}
                  className={`flex items-center w-full px-4 py-2 text-left ${
                    currentSection === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
            <li className="mb-2">
              <button
                onClick={onClose}
                className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">
                  <FaTimes />
                </span>
                Return to Map
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{renderSection()}</div>
    </div>
  );
};

export default AdminPage;
