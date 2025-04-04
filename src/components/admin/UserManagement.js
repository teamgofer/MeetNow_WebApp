import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { FaEdit, FaUserPlus, FaTimes, FaSearch, FaCoins, FaSave, FaTrash } from 'react-icons/fa';
import supabase from '../../supabase';
const UserManagement = ({ onNavigate }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        display_name: '',
        credits: 0,
        is_admin: false,
    });
    const [creditsAmount, setCreditsAmount] = useState(0);
    const [showCreditsDialog, setShowCreditsDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isAddingCredits, setIsAddingCredits] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetchUsers();
    }, []);
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setUsers(data || []);
        }
        catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (user.username?.toLowerCase().includes(searchLower) ||
            user.display_name?.toLowerCase().includes(searchLower) ||
            user.id?.toLowerCase().includes(searchLower));
    });
    const handleEditClick = user => {
        setEditingUser(user);
        setEditForm({
            username: user.username || '',
            display_name: user.display_name || '',
            credits: user.credits || 0,
            is_admin: user.is_admin || false,
        });
    };
    const handleCreditsClick = userId => {
        setSelectedUserId(userId);
        setCreditsAmount(0);
        setShowCreditsDialog(true);
    };
    const handleSaveUser = async () => {
        if (editForm.is_admin && (!editingUser.is_admin || editingUser.is_admin === false)) {
            if (!window.confirm('Are you sure you want to grant ADMIN privileges to this user? They will have full access to all admin functions.')) {
                return;
            }
        }
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                username: editForm.username,
                display_name: editForm.display_name,
                credits: parseInt(editForm.credits, 10),
                is_admin: editForm.is_admin,
                updated_at: new Date(),
            })
                .eq('id', editingUser.id)
                .select();
            if (error)
                throw error;
            setUsers(users.map(user => (user.id === editingUser.id ? { ...user, ...data[0] } : user)));
            setEditingUser(null);
            setEditForm({});
        }
        catch (err) {
            console.error('Error updating user:', err);
            setError('Failed to update user. Please try again.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddCredits = async () => {
        if (!selectedUserId || creditsAmount <= 0)
            return;
        if (!creditsAmount || isNaN(creditsAmount) || creditsAmount <= 0 || creditsAmount > 1000) {
            setError('Credits must be between 1 and 1000');
            return;
        }
        setIsAddingCredits(true);
        try {
            const { data, error } = await supabase.rpc('add_user_credits', {
                user_id: selectedUserId,
                amount: parseInt(creditsAmount, 10),
            });
            if (error)
                throw error;
            const updatedUser = users.find(u => u.id === selectedUserId);
            if (updatedUser) {
                const newCredits = (updatedUser.credits || 0) + parseInt(creditsAmount, 10);
                setUsers(users.map(user => (user.id === selectedUserId ? { ...user, credits: newCredits } : user)));
            }
            setShowCreditsDialog(false);
            setSelectedUserId(null);
            setCreditsAmount(0);
            setIsAddingCredits(false);
        }
        catch (err) {
            console.error('Error adding credits:', err);
            setError('Failed to add credits. Please try again.');
            setIsAddingCredits(false);
        }
    };
    const handleCancelEdit = () => {
        setEditingUser(null);
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "User Management" }), _jsx("p", { className: "text-gray-600", children: "Manage user accounts and permissions" })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Search users...", className: "pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", value: searchTerm, onChange: e => setSearchTerm(e.target.value) }), _jsx(FaSearch, { className: "absolute left-3 top-3 text-gray-400" })] })] }), error && _jsx("div", { className: "bg-red-100 text-red-700 p-4 rounded-lg mb-6", children: error }), loading && !editingUser && !showCreditsDialog ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading users..." })] })) : (_jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Credits" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Admin" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsxs("tbody", { className: "bg-white divide-y divide-gray-200", children: [filteredUsers.map(user => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center", children: user.avatar_url ? (_jsx("img", { src: user.avatar_url, alt: "", className: "h-10 w-10 rounded-full" })) : (_jsx("span", { className: "text-gray-500 font-bold", children: user.username?.[0] || user.display_name?.[0] || '?' })) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: user.display_name || 'No display name' }), _jsxs("div", { className: "text-sm text-gray-500", children: ["@", user.username || 'no-username'] })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: _jsxs("span", { className: "text-xs", children: [user.id.substring(0, 8), "..."] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: user.credits || 0 }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: user.is_admin ? (_jsx("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800", children: "Yes" })) : (_jsx("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800", children: "No" })) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(user.created_at).toLocaleDateString() }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: [_jsx("button", { onClick: () => handleEditClick(user), className: "text-blue-600 hover:text-blue-900 mr-3", children: _jsx(FaEdit, {}) }), _jsx("button", { onClick: () => handleCreditsClick(user.id), className: "text-green-600 hover:text-green-900", children: _jsx(FaCoins, {}) })] })] }, user.id))), filteredUsers.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: "6", className: "px-6 py-4 text-center text-gray-500", children: "No users found matching your search." }) }))] })] }) })), editingUser && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Edit User" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Username" }), _jsx("input", { type: "text", className: "w-full p-2 border rounded", value: editForm.username, onChange: e => setEditForm({ ...editForm, username: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Display Name" }), _jsx("input", { type: "text", className: "w-full p-2 border rounded", value: editForm.display_name, onChange: e => setEditForm({ ...editForm, display_name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Credits" }), _jsx("input", { type: "number", className: "w-full p-2 border rounded", value: editForm.credits, onChange: e => setEditForm({ ...editForm, credits: e.target.value }) })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "isAdmin", className: "mr-2", checked: editForm.is_admin, onChange: e => setEditForm({ ...editForm, is_admin: e.target.checked }) }), _jsx("label", { htmlFor: "isAdmin", className: "text-sm font-medium text-gray-700", children: "Admin User" })] })] }), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsx("button", { onClick: handleCancelEdit, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300", disabled: saving, children: "Cancel" }), _jsx("button", { onClick: handleSaveUser, className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center", disabled: saving, children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(FaSave, { className: "mr-1" }), "Save Changes"] })) })] })] }) })), showCreditsDialog && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Add Credits" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Amount to Add" }), _jsx("input", { type: "number", className: "w-full p-2 border rounded", value: creditsAmount, onChange: e => setCreditsAmount(Math.max(0, parseInt(e.target.value, 10) || 0)) })] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Adding credits to user:", ' ', users.find(u => u.id === selectedUserId)?.username || selectedUserId] })] }), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsxs("button", { onClick: () => setShowCreditsDialog(false), className: "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300", disabled: loading, children: [_jsx(FaTimes, { className: "mr-1 inline" }), "Cancel"] }), _jsx("button", { onClick: handleAddCredits, className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center", disabled: loading || creditsAmount <= 0, children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(FaCoins, { className: "mr-1" }), "Add Credits"] })) })] })] }) }))] }));
};
export default UserManagement;
//# sourceMappingURL=UserManagement.js.map