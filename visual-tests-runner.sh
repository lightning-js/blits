#!/bin/bash
set -e

# Optional: echo the command-line args
echo "Running visual tests with options: $@"

#Install dependencies
npm install

# Install example application dependencies
cd examples && npm install

# Install visual-tests dependencies
cd ../visual-tests && npm install

# Back to blits root dir
cd ..

# Run visual tests with passed arguments
RUNTIME_ENV=ci npm run test:visual -- "$@"