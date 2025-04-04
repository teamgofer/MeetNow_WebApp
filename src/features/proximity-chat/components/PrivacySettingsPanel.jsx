import React, { useState, useEffect } from 'react';

import { useBlockedUsers } from '../context/BlockedUsersContext';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';

import AnonymousModeToggle from './AnonymousModeToggle';
import LocationSharingControls from './LocationSharingControls';

/**
 * Privacy settings panel component for the proximity chat feature
 * Includes anonymous mode toggle and blocked users management
 */
const PrivacySettingsPanel = () => {
  const { blockedUsers, unblockUser, getBlockedUsers, isLoading } = useBlockedUsers();
  const [blockedUserDetails, setBlockedUserDetails] = useState([]);

  // Fetch details for blocked users when component mounts or when blockedUsers changes
  useEffect(() => {
    const fetchBlockedUserDetails = async () => {
      // In a real application, you would fetch user details from an API
      // For now, we'll create some placeholder data
      const userIds = getBlockedUsers();

      if (userIds.length === 0) {
        setBlockedUserDetails([]);
        return;
      }

      // Mock API call to get user details
      // Replace this with actual API call in a real application
      const mockUserDetails = userIds.map(userId => ({
        id: userId,
        username: `User ${userId.substr(0, 5)}...`,
        avatarUrl: null,
        avatarColor: `hsl(${Math.random() * 360}, 70%, 45%)`,
        blockedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(), // Random date within last 30 days
      }));

      setBlockedUserDetails(mockUserDetails);
    };

    fetchBlockedUserDetails();
  }, [blockedUsers, getBlockedUsers]);

  // Handle unblocking a user
  const handleUnblockUser = async userId => {
    await unblockUser(userId);
  };

  // Format the date for display
  const formatBlockedDate = dateString => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="privacy-settings-panel">
      <section className="privacy-settings-section">
        <h2 className="privacy-settings-heading">Privacy Settings</h2>
        <p className="privacy-settings-description">
          Control your privacy and security settings for the proximity chat feature.
        </p>
      </section>

      <section className="privacy-settings-section">
        <AnonymousModeToggle />
      </section>

      <section className="privacy-settings-section">
        <LocationSharingControls onUpdate={() => {}} />
      </section>

      <section className="privacy-settings-section">
        <h3 className="privacy-settings-subheading">Blocked Users</h3>
        <p className="privacy-settings-description">
          Users you've blocked won't be able to see your messages or interact with you.
        </p>

        <div className="blocked-users-list">
          {blockedUserDetails.length === 0 ? (
            <p className="blocked-users-empty">You haven't blocked any users.</p>
          ) : (
            <ul className="blocked-users-items">
              {blockedUserDetails.map(user => (
                <li key={user.id} className="blocked-user-item">
                  <div className="blocked-user-avatar">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={`${user.username}'s avatar`}
                        className="blocked-user-avatar-img"
                      />
                    ) : (
                      <div
                        className="blocked-user-avatar-placeholder"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="blocked-user-info">
                    <div className="blocked-user-name">{user.username}</div>
                    <div className="blocked-user-date">
                      Blocked on {formatBlockedDate(user.blockedAt)}
                    </div>
                  </div>

                  <button
                    className="blocked-user-unblock"
                    onClick={() => handleUnblockUser(user.id)}
                    disabled={isLoading}
                    {...createAccessibleButtonProps(
                      () => handleUnblockUser(user.id),
                      `Unblock user ${user.username}`
                    )}
                  >
                    <span className="blocked-user-unblock-text">Unblock</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M12 11v6m0 0v.01m0-6v-.01" />
                      <path d="M7 7h10v14H7V7z" />
                      <path d="M16 3l-4-2-4 2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="privacy-settings-section">
        <h3 className="privacy-settings-subheading">Data & Privacy</h3>
        <p className="privacy-settings-description">
          Your privacy is important to us. Learn how your data is handled in the proximity chat.
        </p>

        <div className="privacy-details">
          <div className="privacy-detail-item">
            <h4 className="privacy-detail-title">Message Retention</h4>
            <p className="privacy-detail-description">
              Messages are stored for 24 hours and then automatically deleted.
            </p>
          </div>

          <div className="privacy-detail-item">
            <h4 className="privacy-detail-title">Location Data</h4>
            <p className="privacy-detail-description">
              Your precise location is only used to match you with nearby users. Historical location
              data is not stored on our servers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacySettingsPanel;
