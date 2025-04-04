# MeetNow Web App

MeetNow is a web application for creating and joining spontaneous meetups with people nearby.

## Features

### Enhanced Location Search
The application includes a sophisticated location search component with the following features:
- Autocomplete location search with elegant animations
- Recent locations history
- Saved favorite locations
- Current location detection
- Reverse geocoding for address lookup
- Mobile-friendly design with responsive animations

### Meetup Creation
Create meetups with our intuitive interface:
- Set title, description, date and time
- Specify location with our enhanced location search
- Set duration and maximum participants
- Schedule meetups with calendar integration

### User Profiles
- Create and manage your user profile
- View your past and upcoming meetups
- Save favorite locations for quick access

### Performance Optimizations
- Code splitting with React.lazy
- Performance tracking for components
- Optimized image loading

## Development

### Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/meetnow-webapp.git
cd meetnow-webapp
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to http://localhost:3000

### Feature Flags

The application includes feature flags to control feature availability:
- `DEBUG_MODE`: Enables debug menu and additional logging
- `ENABLE_PERFORMANCE_TRACKING`: Enables performance tracking features
- `ENABLE_ANIMATIONS`: Controls whether animations are enabled
- `ENABLE_RECENT_LOCATIONS`: Controls the recent locations feature
- `ENABLE_SAVED_LOCATIONS`: Controls the saved locations feature

### Demo Pages

The application includes several demo pages to showcase specific components:
- `/LocationPage`: Demonstrates the basic location search
- `/EnhancedLocationPage`: Demonstrates the enhanced location search with recent and saved locations
- `/CreateMeetupDemo`: Demonstrates the meetup creation form

## Project Structure

The MeetNow webapp is organized with the following directory structure:

### Core Application
- `src/` - Source code for the application
  - `components/` - Reusable UI components
  - `contexts/` - React context providers
  - `features/` - Feature-specific modules
  - `hooks/` - Custom React hooks
  - `lib/` - Core libraries and utilities
  - `navigation/` - Navigation system
  - `pages/` - Page components
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions

### Documentation
- `docs/` - All project documentation
  - `architecture/` - System design and technical standards
    - `application-interface-diagram.md` - Comprehensive diagram of the application interface
  - `features/` - Feature-specific documentation
    - `directions-navigation.md` - Documentation for the directions and navigation features
  - `guides/` - Developer and user guides
  - `roadmap/` - Product and implementation roadmaps
  - `testing/` - Testing strategies and documentation
  - `troubleshooting/` - Solutions to common issues

### Testing
- `tests/` - Unified testing structure
  - `unit/` - Unit tests for components and functions
  - `integration/` - Integration tests
  - `e2e/` - End-to-end tests
  - `mocks/` - Mock implementations
  - `db/` - Database tests

### Scripts & Utilities
- `scripts/` - Utility scripts
  - `db/` - Database scripts and migrations
  - `dev/` - Development utilities
  - `ci/` - Continuous integration scripts

### Configuration & Build
- `public/` - Static assets
- `config/` - Configuration files
- `.github/` - GitHub workflows and templates
- `.husky/` - Git hooks

## Development Process

### Feature Flags

MeetNow uses a feature flag system to manage feature rollouts and component extraction. You can toggle features in development mode by:

1. Opening the debug menu (bottom right)
2. Enabling/disabling specific features
3. Refreshing the page to see changes

### Code Quality

The project maintains high code quality through:

- ESLint for code linting
- Prettier for code formatting
- TypeScript/JSDoc for static type checking
- Jest and Cypress for testing
- Husky pre-commit hooks for quality checks

### Continuous Integration

The CI pipeline runs:

- Linting
- Type checking
- Unit tests
- End-to-end tests
- Code coverage reporting

## Performance

The application includes a performance dashboard that visualizes:

- Component render times
- Page load metrics
- Network requests
- Resource usage

To access the performance dashboard:

1. Enable debug mode in the feature flags
2. Open the debug menu
3. Click on "Performance Dashboard"

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines

We follow conventional commits format:
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped restore and improve the MeetNow platform

## Versioning

We use [Semantic Versioning](https://semver.org/) for this project.

- **Major version** (1.0.0): Incompatible API changes
- **Minor version** (0.1.0): Backwards-compatible functionality
- **Patch version** (0.0.1): Backwards-compatible bug fixes

### Release Process

1. Make your changes in a feature branch
2. Submit a PR to the main branch
3. After approval and merge, use one of the versioning commands:

```bash
# For bug fixes
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major
```

4. The script will:
   - Update the version in package.json
   - Create a git tag
   - Push changes and tags to the repository

### Changelog

We maintain a [CHANGELOG.md](CHANGELOG.md) file following the [Keep a Changelog](https://keepachangelog.com/) format. This provides a curated, chronologically ordered list of notable changes for each version.

When making changes, please add an entry to the "Unreleased" section of the CHANGELOG. 