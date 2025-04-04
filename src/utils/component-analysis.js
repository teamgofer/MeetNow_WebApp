/**
 * Utility functions for component dependency analysis and extraction preparation
 */

/**
 * Component dependency map for the application
 * Format: { componentId: { dependencies: [], dependents: [] } }
 */
export const componentDependencyMap = {
  // Core components
  MeetNowApp: {
    dependencies: [
      'MapComponent',
      'BottomSheet',
      'NearbyMeetups',
      'MeetupDetails',
      'CreateMeetup',
      'UserProfile',
      'SearchFilter',
      'AuthModal',
    ],
    dependents: [],
  },

  // Map related components
  MapComponent: {
    dependencies: ['MapNavigationController', 'MapMarker', 'MapPopup'],
    dependents: ['MeetNowApp'],
  },
  MapNavigationController: {
    dependencies: [],
    dependents: ['MapComponent'],
  },
  MapMarker: {
    dependencies: [],
    dependents: ['MapComponent'],
  },
  MapPopup: {
    dependencies: [],
    dependents: ['MapComponent'],
  },

  // UI components
  BottomSheet: {
    dependencies: [],
    dependents: ['MeetNowApp'],
  },

  // Meetup related components
  NearbyMeetups: {
    dependencies: ['MeetupCard'],
    dependents: ['MeetNowApp'],
  },
  MeetupCard: {
    dependencies: [],
    dependents: ['NearbyMeetups'],
  },
  MeetupDetails: {
    dependencies: ['AttendeesList', 'MeetupActions'],
    dependents: ['MeetNowApp'],
  },
  AttendeesList: {
    dependencies: [],
    dependents: ['MeetupDetails'],
  },
  MeetupActions: {
    dependencies: [],
    dependents: ['MeetupDetails'],
  },
  CreateMeetup: {
    dependencies: ['CategorySelector', 'DateTimePicker', 'LocationPicker'],
    dependents: ['MeetNowApp'],
  },
  CategorySelector: {
    dependencies: [],
    dependents: ['CreateMeetup'],
  },
  DateTimePicker: {
    dependencies: [],
    dependents: ['CreateMeetup'],
  },
  LocationPicker: {
    dependencies: ['MapComponent'],
    dependents: ['CreateMeetup'],
  },

  // User related components
  UserProfile: {
    dependencies: ['ProfileInfo', 'UserMeetups'],
    dependents: ['MeetNowApp'],
  },
  ProfileInfo: {
    dependencies: [],
    dependents: ['UserProfile'],
  },
  UserMeetups: {
    dependencies: ['MeetupCard'],
    dependents: ['UserProfile'],
  },

  // Filter related components
  SearchFilter: {
    dependencies: ['DistanceSlider', 'CategoryFilter', 'TimeFilter'],
    dependents: ['MeetNowApp'],
  },
  DistanceSlider: {
    dependencies: [],
    dependents: ['SearchFilter'],
  },
  CategoryFilter: {
    dependencies: [],
    dependents: ['SearchFilter'],
  },
  TimeFilter: {
    dependencies: [],
    dependents: ['SearchFilter'],
  },

  // Authentication components
  AuthModal: {
    dependencies: ['LoginForm', 'SignupForm', 'ResetPasswordForm'],
    dependents: ['MeetNowApp'],
  },
  LoginForm: {
    dependencies: [],
    dependents: ['AuthModal'],
  },
  SignupForm: {
    dependencies: [],
    dependents: ['AuthModal'],
  },
  ResetPasswordForm: {
    dependencies: [],
    dependents: ['AuthModal'],
  },
};

/**
 * Get leaf components (those with no dependencies)
 * @returns {Array} Array of component IDs with no dependencies
 */
export const getLeafComponents = () => {
  return Object.entries(componentDependencyMap)
    .filter(([_, { dependencies }]) => dependencies.length === 0)
    .map(([componentId]) => componentId);
};

/**
 * Get components that only depend on leaf components
 * @returns {Array} Array of component IDs that only depend on leaf components
 */
export const getSecondLevelComponents = () => {
  return Object.entries(componentDependencyMap)
    .filter(([componentId, { dependencies }]) => {
      if (dependencies.length === 0) return false;
      return dependencies.every(depId => componentDependencyMap[depId]?.dependencies.length === 0);
    })
    .map(([componentId]) => componentId);
};

/**
 * Get all components in dependency order
 * @returns {Array} Array of component IDs in order they should be extracted
 */
export const getExtractionOrder = () => {
  const visited = new Set();
  const result = [];

  // Recursive function to visit components in topological order
  const visit = componentId => {
    if (visited.has(componentId)) return;

    visited.add(componentId);

    // Visit dependencies first
    const dependencies = componentDependencyMap[componentId]?.dependencies || [];
    dependencies.forEach(depId => visit(depId));

    // Then add this component
    result.push(componentId);
  };

  // Start from MeetNowApp and visit all components
  visit('MeetNowApp');

  // Return components in reverse order (leaves first)
  return result.reverse();
};

/**
 * Get state dependencies for a component
 * @param {string} componentId - The component ID
 * @returns {Object} State dependencies by domain
 */
export const getStateDependencies = componentId => {
  // Static mapping of component state dependencies
  const stateDependencies = {
    MeetNowApp: {
      meetup: ['activeMeetup', 'nearbyMeetups', 'isCreatingMeetup'],
      map: ['center', 'zoom', 'userLocation', 'isMapInitialized'],
      user: ['profile', 'isAuthenticated'],
      ui: ['bottomSheetState', 'activeModal', 'currentTab'],
    },
    NearbyMeetups: {
      meetup: ['nearbyMeetups', 'filters'],
      map: ['userLocation'],
      ui: ['bottomSheetState'],
    },
    MeetupDetails: {
      meetup: ['activeMeetup'],
      user: ['profile', 'isAuthenticated'],
      ui: ['bottomSheetState'],
    },
    CreateMeetup: {
      meetup: ['isCreatingMeetup'],
      map: ['userLocation'],
      user: ['profile', 'isAuthenticated'],
      ui: ['bottomSheetState'],
    },
    UserProfile: {
      user: ['profile', 'isAuthenticated'],
      meetup: ['joinedMeetups', 'createdMeetups'],
      ui: ['bottomSheetState'],
    },
    MapComponent: {
      map: [
        'center',
        'zoom',
        'userLocation',
        'isMapInitialized',
        'visibleMarkers',
        'activeMarkerId',
      ],
      meetup: ['nearbyMeetups', 'activeMeetup'],
    },
    BottomSheet: {
      ui: ['bottomSheetState'],
    },
    SearchFilter: {
      meetup: ['filters'],
      ui: ['isLoading'],
    },
  };

  return stateDependencies[componentId] || {};
};

/**
 * Check if a component has circular dependencies
 * @param {string} componentId - The component ID
 * @returns {boolean} Whether the component has circular dependencies
 */
export const hasCircularDependencies = componentId => {
  const visited = new Set();
  const recursionStack = new Set();

  // Recursive function to detect cycles
  const detectCycle = currentId => {
    if (recursionStack.has(currentId)) return true;
    if (visited.has(currentId)) return false;

    visited.add(currentId);
    recursionStack.add(currentId);

    const dependencies = componentDependencyMap[currentId]?.dependencies || [];
    for (const depId of dependencies) {
      if (detectCycle(depId)) return true;
    }

    recursionStack.delete(currentId);
    return false;
  };

  return detectCycle(componentId);
};

/**
 * Generate extraction plan for all components
 * @returns {Array} Components in order with their dependencies
 */
export const generateExtractionPlan = () => {
  const extractionOrder = getExtractionOrder();

  return extractionOrder.map(componentId => ({
    componentId,
    dependencies: componentDependencyMap[componentId]?.dependencies || [],
    stateDependencies: getStateDependencies(componentId),
    hasCircularDependency: hasCircularDependencies(componentId),
    isLeafComponent: componentDependencyMap[componentId]?.dependencies.length === 0,
  }));
};

/**
 * Recommend the next components to extract
 * @param {number} count - Number of components to recommend
 * @returns {Array} Recommended components to extract next
 */
export const getNextComponentsToExtract = (count = 3) => {
  // Get all components in extraction order
  const extractionPlan = generateExtractionPlan();

  // Filter out components with circular dependencies
  const validComponents = extractionPlan.filter(component => !component.hasCircularDependency);

  // Return the first 'count' components
  return validComponents.slice(0, count);
};
