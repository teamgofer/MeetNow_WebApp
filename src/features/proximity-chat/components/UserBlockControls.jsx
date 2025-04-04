import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { useBlockedUsers } from '../context/BlockedUsersContext';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';

/**
 * Component that provides controls for blocking/unblocking users
 * in the proximity chat feature
 */
const UserBlockControls = ({ userId, username, onBlock, onUnblock, compact = false }) => {
  const { blockUser, unblockUser, isUserBlocked, isLoading } = useBlockedUsers();
  const [showConfirm, setShowConfirm] = useState(false);

  const isBlocked = isUserBlocked(userId);

  // Handle block user action
  const handleBlock = async () => {
    if (showConfirm) {
      const success = await blockUser(userId);
      if (success && onBlock) {
        onBlock(userId);
      }
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  // Handle unblock user action
  const handleUnblock = async () => {
    const success = await unblockUser(userId);
    if (success && onUnblock) {
      onUnblock(userId);
    }
  };

  // Handle cancel confirmation
  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Create accessible button props
  const blockButtonProps = createAccessibleButtonProps(
    handleBlock,
    isBlocked ? 'Unblock this user' : 'Block this user'
  );

  const cancelButtonProps = createAccessibleButtonProps(handleCancel, 'Cancel blocking this user');

  // Render compact version (icon only)
  if (compact) {
    return (
      <div className="user-block-controls user-block-controls--compact">
        {isBlocked ? (
          <button
            className="user-block-button user-block-button--unblock"
            onClick={handleUnblock}
            disabled={isLoading}
            aria-busy={isLoading}
            {...createAccessibleButtonProps(handleUnblock, `Unblock ${username}`)}
          >
            <span className="sr-only">Unblock {username}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 11v6m0 0v.01m0-6v-.01" />
              <path d="M7 7h10v14H7V7z" />
              <path d="M16 3l-4-2-4 2" />
            </svg>
          </button>
        ) : (
          <>
            {showConfirm ? (
              <div className="user-block-confirm user-block-confirm--compact">
                <button
                  className="user-block-button user-block-button--confirm"
                  onClick={handleBlock}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  {...blockButtonProps}
                >
                  <span className="sr-only">Confirm block {username}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  className="user-block-button user-block-button--cancel"
                  onClick={handleCancel}
                  disabled={isLoading}
                  {...cancelButtonProps}
                >
                  <span className="sr-only">Cancel block {username}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                className="user-block-button user-block-button--block"
                onClick={handleBlock}
                disabled={isLoading}
                aria-busy={isLoading}
                {...blockButtonProps}
              >
                <span className="sr-only">Block {username}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Render full version with text
  return (
    <div className="user-block-controls">
      {isBlocked ? (
        <button
          className="user-block-button user-block-button--unblock"
          onClick={handleUnblock}
          disabled={isLoading}
          aria-busy={isLoading}
          {...createAccessibleButtonProps(handleUnblock, `Unblock ${username}`)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 11v6m0 0v.01m0-6v-.01" />
            <path d="M7 7h10v14H7V7z" />
            <path d="M16 3l-4-2-4 2" />
          </svg>
          <span>Unblock {username}</span>
        </button>
      ) : (
        <>
          {showConfirm ? (
            <div className="user-block-confirm">
              <p className="user-block-confirm-text">
                Block {username}? You won't see their messages.
              </p>
              <div className="user-block-confirm-buttons">
                <button
                  className="user-block-button user-block-button--confirm"
                  onClick={handleBlock}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  {...blockButtonProps}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Block User</span>
                </button>
                <button
                  className="user-block-button user-block-button--cancel"
                  onClick={handleCancel}
                  disabled={isLoading}
                  {...cancelButtonProps}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              className="user-block-button user-block-button--block"
              onClick={handleBlock}
              disabled={isLoading}
              aria-busy={isLoading}
              {...blockButtonProps}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93l14.14 14.14" />
              </svg>
              <span>Block User</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

UserBlockControls.propTypes = {
  userId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  onBlock: PropTypes.func,
  onUnblock: PropTypes.func,
  compact: PropTypes.bool,
};

export default UserBlockControls;
