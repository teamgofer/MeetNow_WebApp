# MeetNow UI Components

This directory contains UI proof-of-concept components for the MeetNow platform. These components are designed to be viewed and tested in isolation before being integrated into the main application.

## Component Demos

We've created several demo files to showcase different UI components and themes:

- `demo.html` - Basic button component demos
- `cards.html` - Card component demos
- `navigation.html` - Navigation component demos
- `neumorphic-drift.html` - Neumorphic design with drifting background effects
- `neumorphic-ocean.html` - Ocean-themed UI with gentle water-like animations

## How to View Demos

You can view any demo by running the corresponding npm script:

```bash
# View button demos
npm run ui-demo-simple

# View card components
npm run ui-cards

# View navigation components
npm run ui-nav

# View neumorphic design with drift effect
npm run ui-drift

# View ocean-themed neumorphic UI
npm run ui-ocean
```

## Development Process

1. Create new components in this directory
2. Test them using standalone HTML files
3. When ready, integrate them into the main application

## Design Philosophy

Our UI components follow these principles:

- **Visual Appeal**: Rich animations and visual effects
- **Performance**: Optimized for smooth performance
- **Modularity**: Components can be used independently
- **Consistent Theme**: Following our design system

## Documentation

For more detailed information about our UI development process and components, see the [UI Development Journal](./ui-journal.md).

## Directory Structure

```
src/features/ui-poc/
├── README.md                # This file
├── ui-journal.md            # Development journal
├── demo.html                # Button component demos
├── cards.html               # Card component demos
├── navigation.html          # Navigation component demos
├── neumorphic-drift.html    # Neumorphic design with drift effect
└── neumorphic-ocean.html    # Ocean-themed neumorphic UI
```

## Adding New Components

To add a new component:

1. Create the component HTML/CSS/JS in a new or existing demo file
2. Add a script to `package.json` to easily view the component
3. Document the component in the UI journal 