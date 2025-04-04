import PropTypes from 'prop-types';
import React from 'react';

const NearbyUsers = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <div className="p-3 flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>No users nearby. Move around to find people!</p>
      </div>
    );
  }

  return (
    <div className="p-2 h-full">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
        Nearby Users ({users.length})
      </h3>

      <div className="flex items-center space-x-2 overflow-x-auto pb-1 h-12">
        {users.map(user => (
          <div
            key={user.sessionId}
            className="flex flex-col items-center justify-center min-w-[60px] h-full px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-medium text-xs"
              style={{
                backgroundColor: getUserColor(user.sessionId),
              }}
            >
              {user.sessionId.substring(0, 2).toUpperCase()}
            </div>

            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
              {user.sessionId.substring(0, 8)}
            </div>

            {user.distance !== undefined && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistance(user.distance)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to generate a consistent color based on sessionId
const getUserColor = sessionId => {
  // Simple hash function to generate a color
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.substr(-2);
  }

  return color;
};

// Format distance in a user-friendly way
const formatDistance = distance => {
  if (distance < 1) {
    return 'here';
  } else if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

NearbyUsers.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      distance: PropTypes.number,
    })
  ),
};

NearbyUsers.defaultProps = {
  users: [],
};

export default NearbyUsers;
