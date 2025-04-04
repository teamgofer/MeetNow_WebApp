#!/bin/bash
# Disable husky in CI environment
export HUSKY=0

# First install without dev dependencies (faster)
npm install --omit=dev

# Then install only Vite and its plugin which are needed for the build
npm install --no-save vite @vitejs/plugin-react vite-tsconfig-paths

# Run the build
npx vite build 