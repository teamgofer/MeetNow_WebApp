# MeetNow Documentation

Welcome to the documentation for the MeetNow application. This directory contains comprehensive guides to help you understand, maintain, and extend the application.

## Documentation Index

### [Handover Document](./HANDOVER.md)
The primary handover document provides a high-level overview of the application, its features, recent improvements, and known limitations. This is the best starting point for new developers.

### [Technical Architecture](./ARCHITECTURE.md)
Detailed explanation of the application's technical structure, component hierarchy, data flow, and key technologies. This document is essential for understanding how the different parts of the application interact.

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
2. Preserve the three navigation modes and their specific behaviors
3. Follow the existing code style and conventions
4. Test all changes thoroughly in different browsers and devices
5. Update documentation when adding/changing significant functionality 