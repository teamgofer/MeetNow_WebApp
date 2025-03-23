import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaUsers, FaMapMarkerAlt, FaCreditCard, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import supabase from '../../supabase';

/**
 * Admin Dashboard component
 * Displays overview statistics and quick actions
 */
const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    userCount: 0,
    activeMeetups: 0,
    expiredMeetups: 0,
    creditTransactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get total user count
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Get active meetup count
        const { count: activeMeetupCount, error: activeMeetupError } = await supabase
          .from('meetups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (activeMeetupError) throw activeMeetupError;

        // Get expired meetup count
        const { count: expiredMeetupCount, error: expiredMeetupError } = await supabase
          .from('meetups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'expired');

        if (expiredMeetupError) throw expiredMeetupError;

        // Get credit transactions count
        const { count: creditTransactionsCount, error: creditError } = await supabase
          .from('credits_history')
          .select('*', { count: 'exact', head: true });

        if (creditError) throw creditError;

        setStats({
          userCount: userCount || 0,
          activeMeetups: activeMeetupCount || 0,
          expiredMeetups: expiredMeetupCount || 0,
          creditTransactions: creditTransactionsCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Component to display individual statistic
  const StatCard = ({ title, value, icon, navigateTo, color }) => (
    <div 
      className={`bg-white p-4 rounded-lg shadow ${color} border-l-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => navigateTo && onNavigate(navigateTo)}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1">
            <p className="text-2xl font-semibold text-gray-900">
              {isLoading ? (
                <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                value
              )}
            </p>
          </div>
        </div>
        <div className="p-3 bg-gray-100 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.userCount} 
          icon={<FaUsers size={18} />} 
          navigateTo="users" 
          color="border-blue-500"
        />
        <StatCard 
          title="Active Meetups" 
          value={stats.activeMeetups} 
          icon={<FaMapMarkerAlt size={18} />} 
          navigateTo="meetups" 
          color="border-green-500"
        />
        <StatCard 
          title="Expired Meetups" 
          value={stats.expiredMeetups} 
          icon={<FaMapMarkerAlt size={18} />} 
          navigateTo="meetups" 
          color="border-yellow-500"
        />
        <StatCard 
          title="Credit Transactions" 
          value={stats.creditTransactions} 
          icon={<FaCreditCard size={18} />} 
          navigateTo="credits" 
          color="border-purple-500"
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Manage Users
          </button>
          <button 
            onClick={() => onNavigate('meetups')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            View Active Meetups
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            System Settings
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-4">System Status</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Database
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Operational
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Authentication
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Operational
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Storage
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Operational
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 