/**
 * Navigation System - Main entry point
 *
 * This file exports all navigation-related components and utilities,
 * providing a clean API for the rest of the application.
 */

// Core navigation state management
import NavigationController from './NavigationController';
import NavigationCore, { NavigationMode, NavigationEvent, isValidLocation } from './NavigationCore';

// Navigation controller

// Main integration component
import NavigationSystem from './NavigationSystem';

// Export everything
export {
  // Core functionality
  NavigationCore,
  NavigationController,

  // Constants
  NavigationMode,
  NavigationEvent,

  // Utility functions
  isValidLocation,

  // React components
  NavigationSystem,
};

// Default export is the main integration component
export default NavigationSystem;
