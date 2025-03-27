# MeetNow Documentation

This directory contains all technical documentation for the MeetNow webapp. The documentation is organized into the following sections:

## Directory Structure

- **architecture/** - System design, component relationships, and technical standards
  - Technical specifications and architecture decisions
  - Navigation system documentation
  - Location format standards

- **features/** - Detailed documentation for specific features
  - Smart Search & Intelligent Zoom
  - Map Overzooming
  - Proximity Chat
  - Region Management
  - And other feature-specific documentation

- **guides/** - Developer and user guides
  - File handling guidelines
  - Image storage documentation
  - Handover documentation
  - Import guides

- **roadmap/** - Product and implementation roadmaps
  - Feature roadmap
  - Development timeline
  - Implementation plans

- **testing/** - Testing documentation and strategies
  - Testing approaches
  - Test coverage guidelines
  - QA processes

- **troubleshooting/** - Solutions to common issues
  - General troubleshooting
  - Wasabi storage troubleshooting

## Version Control

Documentation should follow the same versioning conventions as the codebase. When making significant changes to documentation, update the corresponding version number according to our versioning guidelines.

## Contributing

When adding new documentation:
1. Place it in the appropriate subdirectory
2. Follow the existing naming conventions
3. Link it to related documentation where appropriate
4. Update this README if you add new categories

## Maintenance

Documentation should be reviewed and updated regularly to ensure it remains accurate. Outdated documentation should be marked as such or removed to prevent confusion.

## Documentation Index

### [Handover Document](./HANDOVER.md)
The primary handover document provides a high-level overview of the application, its features, recent improvements, and known limitations. This is the best starting point for new developers.

### [Technical Architecture](./ARCHITECTURE.md)
Detailed explanation of the application's technical structure, component hierarchy, data flow, and key technologies. This document is essential for understanding how the different parts of the application interact.

### [Navigation System](./NAVIGATION_SYSTEM.md)
Documentation of the simplified navigation system, including implementation details, error handling, and best practices for working with the MapNavigationController.

### [Troubleshooting Guide](./TROUBLESHOOTING.md)
Solutions for common issues, debugging techniques, and recovery procedures. Refer to this document when you encounter problems or unexpected behavior.

## Repository Structure

The MeetNow application follows this high-level structure:

```
/
├── docs/                  # Documentation
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── map/           # Map-related components
│   │   └── ui/            # General UI components
│   ├── features/          # Feature-specific code
│   ├── utils/             # Utility functions
│   │   └── MapNavigationController.js  # Core navigation controller
│   └── MeetNowApp.jsx     # Main application component
├── supabase/              # Backend configuration
└── ...                    # Configuration files
```

## Getting Started with Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Visit `localhost:3000` (or the port specified in the terminal)

## Contribution Guidelines

When making changes to the application, please follow these guidelines:

1. Maintain the separation between user location and selected location
2. Use the controller-based approach for map interactions
3. Follow the existing code style and conventions
4. Test all changes thoroughly in different browsers and devices
5. Update documentation when adding/changing significant functionality
6. Always ensure navigation operations are properly error-handled
7. For navigation operations, check `navigationController.isReadyToNavigate()` before performing them 