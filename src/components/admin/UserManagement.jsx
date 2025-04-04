import React, { useState, useEffect } from 'react';
import { FaEdit, FaUserPlus, FaTimes, FaSearch, FaCoins, FaSave, FaTrash } from 'react-icons/fa';

import supabase from '../../supabase';

/**
 * UserManagement - Admin interface for managing users
 * Allows viewing, filtering, and editing user profiles
 */
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

  // Load users
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

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.id?.toLowerCase().includes(searchLower)
    );
  });

  // Start editing a user
  const handleEditClick = user => {
    setEditingUser(user);
    setEditForm({
      username: user.username || '',
      display_name: user.display_name || '',
      credits: user.credits || 0,
      is_admin: user.is_admin || false,
    });
  };

  // Open credits dialog
  const handleCreditsClick = userId => {
    setSelectedUserId(userId);
    setCreditsAmount(0);
    setShowCreditsDialog(true);
  };

  // Update user profile
  const handleSaveUser = async () => {
    // Add admin privilege confirmation
    if (editForm.is_admin && (!editingUser.is_admin || editingUser.is_admin === false)) {
      if (
        !window.confirm(
          'Are you sure you want to grant ADMIN privileges to this user? They will have full access to all admin functions.'
        )
      ) {
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

      if (error) throw error;

      // Update the user in the users array
      setUsers(users.map(user => (user.id === editingUser.id ? { ...user, ...data[0] } : user)));
      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add credits to user
  const handleAddCredits = async () => {
    if (!selectedUserId || creditsAmount <= 0) return;

    if (!creditsAmount || isNaN(creditsAmount) || creditsAmount <= 0 || creditsAmount > 1000) {
      setError('Credits must be between 1 and 1000');
      return;
    }

    setIsAddingCredits(true);

    try {
      // Call the add_user_credits function
      const { data, error } = await supabase.rpc('add_user_credits', {
        user_id: selectedUserId,
        amount: parseInt(creditsAmount, 10),
      });

      if (error) throw error;

      // Update the user in local state
      const updatedUser = users.find(u => u.id === selectedUserId);
      if (updatedUser) {
        const newCredits = (updatedUser.credits || 0) + parseInt(creditsAmount, 10);
        setUsers(
          users.map(user => (user.id === selectedUserId ? { ...user, credits: newCredits } : user))
        );
      }

      setShowCreditsDialog(false);
      setSelectedUserId(null);
      setCreditsAmount(0);
      setIsAddingCredits(false);
    } catch (err) {
      console.error('Error adding credits:', err);
      setError('Failed to add credits. Please try again.');
      setIsAddingCredits(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      {loading && !editingUser && !showCreditsDialog ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-gray-500 font-bold">
                            {user.username?.[0] || user.display_name?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name || 'No display name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="text-xs">{user.id.substring(0, 8)}...</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.credits || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.is_admin ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleCreditsClick(user.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <FaCoins />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editForm.username}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editForm.display_name}
                  onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editForm.credits}
                  onChange={e => setEditForm({ ...editForm, credits: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  className="mr-2"
                  checked={editForm.is_admin}
                  onChange={e => setEditForm({ ...editForm, is_admin: e.target.checked })}
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                  Admin User
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showCreditsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Credits</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Add
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={creditsAmount}
                  onChange={e => setCreditsAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>
              <p className="text-sm text-gray-600">
                Adding credits to user:{' '}
                {users.find(u => u.id === selectedUserId)?.username || selectedUserId}
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreditsDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={loading}
              >
                <FaTimes className="mr-1 inline" />
                Cancel
              </button>
              <button
                onClick={handleAddCredits}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                disabled={loading || creditsAmount <= 0}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCoins className="mr-1" />
                    Add Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
