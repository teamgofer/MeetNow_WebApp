import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { localStorageKeys } from '../constants';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

// Initial state
const initialState = {
  blockedUsers: [],
  isLoading: false,
  error: null
};

// Action types
const ACTIONS = {
  BLOCK_USER_REQUEST: 'BLOCK_USER_REQUEST',
  BLOCK_USER_SUCCESS: 'BLOCK_USER_SUCCESS',
  BLOCK_USER_FAILURE: 'BLOCK_USER_FAILURE',
  UNBLOCK_USER_REQUEST: 'UNBLOCK_USER_REQUEST',
  UNBLOCK_USER_SUCCESS: 'UNBLOCK_USER_SUCCESS',
  UNBLOCK_USER_FAILURE: 'UNBLOCK_USER_FAILURE',
  LOAD_BLOCKED_USERS: 'LOAD_BLOCKED_USERS'
};

// Reducer
function blockedUsersReducer(state, action) {
  switch (action.type) {
    case ACTIONS.BLOCK_USER_REQUEST:
    case ACTIONS.UNBLOCK_USER_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case ACTIONS.BLOCK_USER_SUCCESS:
      return {
        ...state,
        blockedUsers: [...state.blockedUsers, action.payload],
        isLoading: false
      };
    
    case ACTIONS.UNBLOCK_USER_SUCCESS:
      return {
        ...state,
        blockedUsers: state.blockedUsers.filter(userId => userId !== action.payload),
        isLoading: false
      };
    
    case ACTIONS.BLOCK_USER_FAILURE:
    case ACTIONS.UNBLOCK_USER_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case ACTIONS.LOAD_BLOCKED_USERS:
      return {
        ...state,
        blockedUsers: action.payload,
        isLoading: false
      };
    
    default:
      return state;
  }
}

// Create context
const BlockedUsersContext = createContext();

// Provider component
export function BlockedUsersProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(blockedUsersReducer, initialState);
  const renderStartTimeRef = React.useRef(Date.now());
  
  // Track provider initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', renderDuration, {
      success: true,
      action: 'initialize',
      userId: user?.id,
      blockedUsersCount: state.blockedUsers.length
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [user?.id, state.blockedUsers.length]);
  
  // Load blocked users from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const startTime = Date.now();
      const storageKey = `${localStorageKeys.BLOCKED_USERS}_${user.id}`;
      const storedBlockedUsers = localStorage.getItem(storageKey);
      
      if (storedBlockedUsers) {
        try {
          const parsedBlockedUsers = JSON.parse(storedBlockedUsers);
          dispatch({ 
            type: ACTIONS.LOAD_BLOCKED_USERS, 
            payload: parsedBlockedUsers 
          });
          
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
            success: true,
            action: 'loadFromStorage',
            userId: user.id,
            blockedUsersCount: parsedBlockedUsers.length
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
            success: false,
            action: 'loadFromStorage',
            error: error.message,
            userId: user.id
          });
          console.error('Error parsing blocked users from localStorage:', error);
        }
      }
    }
  }, [user?.id]);
  
  // Save blocked users to localStorage when it changes
  useEffect(() => {
    if (user?.id && state.blockedUsers.length >= 0) {
      const startTime = Date.now();
      const storageKey = `${localStorageKeys.BLOCKED_USERS}_${user.id}`;
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(state.blockedUsers));
        
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
          success: true,
          action: 'saveToStorage',
          userId: user.id,
          blockedUsersCount: state.blockedUsers.length
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
          success: false,
          action: 'saveToStorage',
          error: error.message,
          userId: user.id,
          blockedUsersCount: state.blockedUsers.length
        });
        console.error('Error saving blocked users to localStorage:', error);
      }
    }
  }, [state.blockedUsers, user?.id]);
  
  // Block a user
  const blockUser = async (userId) => {
    if (!userId) return false;
    
    const startTime = Date.now();
    dispatch({ type: ACTIONS.BLOCK_USER_REQUEST });
    
    try {
      // In a real app, you might want to sync this with your backend
      // For now, we'll just update the local state
      
      // Optional: Add API call here to sync with backend
      // await blockUserAPI(userId);
      
      dispatch({ 
        type: ACTIONS.BLOCK_USER_SUCCESS, 
        payload: userId 
      });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
        success: true,
        action: 'blockUser',
        userId: user.id,
        blockedUserId: userId,
        blockedUsersCount: state.blockedUsers.length + 1
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
        success: false,
        action: 'blockUser',
        error: error.message,
        userId: user.id,
        blockedUserId: userId
      });
      
      dispatch({ 
        type: ACTIONS.BLOCK_USER_FAILURE, 
        payload: error.message || 'Failed to block user' 
      });
      
      return false;
    }
  };
  
  // Unblock a user
  const unblockUser = async (userId) => {
    if (!userId) return false;
    
    const startTime = Date.now();
    dispatch({ type: ACTIONS.UNBLOCK_USER_REQUEST });
    
    try {
      // In a real app, you might want to sync this with your backend
      // For now, we'll just update the local state
      
      // Optional: Add API call here to sync with backend
      // await unblockUserAPI(userId);
      
      dispatch({ 
        type: ACTIONS.UNBLOCK_USER_SUCCESS, 
        payload: userId 
      });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
        success: true,
        action: 'unblockUser',
        userId: user.id,
        unblockedUserId: userId,
        blockedUsersCount: state.blockedUsers.length - 1
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
        success: false,
        action: 'unblockUser',
        error: error.message,
        userId: user.id,
        unblockedUserId: userId
      });
      
      dispatch({ 
        type: ACTIONS.UNBLOCK_USER_FAILURE, 
        payload: error.message || 'Failed to unblock user' 
      });
      
      return false;
    }
  };
  
  // Check if a user is blocked
  const isUserBlocked = (userId) => {
    const startTime = Date.now();
    const result = state.blockedUsers.includes(userId);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
      success: true,
      action: 'isUserBlocked',
      userId: user.id,
      checkedUserId: userId,
      isBlocked: result
    });
    
    return result;
  };
  
  // Get all blocked users
  const getBlockedUsers = () => {
    const startTime = Date.now();
    const result = state.blockedUsers;
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('context', 'BlockedUsersProvider', duration, {
      success: true,
      action: 'getBlockedUsers',
      userId: user.id,
      blockedUsersCount: result.length
    });
    
    return result;
  };
  
  // Context value
  const value = {
    blockedUsers: state.blockedUsers,
    isLoading: state.isLoading,
    error: state.error,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers
  };
  
  return (
    <BlockedUsersContext.Provider value={value}>
      {children}
    </BlockedUsersContext.Provider>
  );
}

// Custom hook to use the blocked users context
export function useBlockedUsers() {
  const context = useContext(BlockedUsersContext);
  
  if (context === undefined) {
    throw new Error('useBlockedUsers must be used within a BlockedUsersProvider');
  }
  
  return context;
}

export default BlockedUsersContext; 