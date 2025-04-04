#!/bin/bash
# Disable husky in CI environment
export HUSKY=0
npm install
npx vite build 