import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaUsers, FaMapMarkerAlt, FaCreditCard, FaCog, FaExclamationTriangle, } from 'react-icons/fa';
import supabase from '../../supabase';
const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        userCount: 0,
        activeMeetups: 0,
        expiredMeetups: 0,
        creditTransactions: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });
                if (userError)
                    throw userError;
                const { count: activeMeetupCount, error: activeMeetupError } = await supabase
                    .from('meetups')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');
                if (activeMeetupError)
                    throw activeMeetupError;
                const { count: expiredMeetupCount, error: expiredMeetupError } = await supabase
                    .from('meetups')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'expired');
                if (expiredMeetupError)
                    throw expiredMeetupError;
                const { count: creditTransactionsCount, error: creditError } = await supabase
                    .from('credits_history')
                    .select('*', { count: 'exact', head: true });
                if (creditError)
                    throw creditError;
                setStats({
                    userCount: userCount || 0,
                    activeMeetups: activeMeetupCount || 0,
                    expiredMeetups: expiredMeetupCount || 0,
                    creditTransactions: creditTransactionsCount || 0,
                });
            }
            catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setError('Failed to load dashboard statistics');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);
    const StatCard = ({ title, value, icon, navigateTo, color }) => (_jsx("div", { className: `bg-white p-4 rounded-lg shadow ${color} border-l-4 cursor-pointer hover:shadow-md transition-shadow`, onClick: () => navigateTo && onNavigate(navigateTo), children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: title }), _jsx("div", { className: "mt-1", children: _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: isLoading ? (_jsx("span", { className: "inline-block w-12 h-6 bg-gray-200 animate-pulse rounded" })) : (value) }) })] }), _jsx("div", { className: "p-3 bg-gray-100 rounded-full", children: icon })] }) }));
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Admin Dashboard" }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(FaExclamationTriangle, { className: "h-5 w-5 text-red-400" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-sm", children: error }) })] }) })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [_jsx(StatCard, { title: "Total Users", value: stats.userCount, icon: _jsx(FaUsers, { size: 18 }), navigateTo: "users", color: "border-blue-500" }), _jsx(StatCard, { title: "Active Meetups", value: stats.activeMeetups, icon: _jsx(FaMapMarkerAlt, { size: 18 }), navigateTo: "meetups", color: "border-green-500" }), _jsx(StatCard, { title: "Expired Meetups", value: stats.expiredMeetups, icon: _jsx(FaMapMarkerAlt, { size: 18 }), navigateTo: "meetups", color: "border-yellow-500" }), _jsx(StatCard, { title: "Credit Transactions", value: stats.creditTransactions, icon: _jsx(FaCreditCard, { size: 18 }), navigateTo: "credits", color: "border-purple-500" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-lg font-medium mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("button", { onClick: () => onNavigate('users'), className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Manage Users" }), _jsx("button", { onClick: () => onNavigate('meetups'), className: "px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors", children: "View Active Meetups" }), _jsx("button", { onClick: () => onNavigate('settings'), className: "px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors", children: "System Settings" })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-medium mb-4", children: "System Status" }), _jsx("div", { className: "bg-white shadow rounded-lg overflow-hidden", children: _jsx("div", { className: "px-4 py-5 sm:p-6", children: _jsxs("dl", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Database" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: _jsx("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800", children: "Operational" }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Authentication" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: _jsx("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800", children: "Operational" }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Storage" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: _jsx("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800", children: "Operational" }) })] })] }) }) })] })] }));
};
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map