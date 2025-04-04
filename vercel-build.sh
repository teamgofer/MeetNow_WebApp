#!/bin/bash
# Disable husky in CI environment
export HUSKY=0
npm install
npm run build 