#!/bin/bash

echo "Running Frontend Test Suite..."
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
fi

echo
echo "Running unit tests with coverage..."
npm run test:ci
if [ $? -ne 0 ]; then
    echo "Unit tests failed"
    exit 1
fi

echo
echo "Running linting checks..."
npm run lint:check
if [ $? -ne 0 ]; then
    echo "Linting failed"
    exit 1
fi

echo
echo "Running format checks..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "Format check failed"
    exit 1
fi

echo
echo "All frontend tests passed successfully!"
echo "Coverage report available at: coverage/lcov-report/index.html"
echo

echo "To run E2E tests, use:"
echo "  npm run test:e2e:open  (interactive)"
echo "  npm run test:e2e       (headless)"
echo

read -p "Press any key to continue..."