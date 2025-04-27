#!/bin/bash

# Test script for MoodflixMobile application
echo "Starting MoodflixMobile test suite..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run tests."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm to run tests."
    exit 1
fi

# Navigate to project directory
cd /home/ubuntu/MoodflixMobile-Optimized

# Install dependencies
echo "Installing dependencies..."
npm install

# Run ESLint to check for code quality issues
echo "Running ESLint to check code quality..."
npx eslint . --ext .js,.jsx,.ts,.tsx || echo "ESLint found issues that should be addressed"

# Run TypeScript compiler to check for type errors
echo "Running TypeScript compiler to check for type errors..."
npx tsc --noEmit || echo "TypeScript found type errors that should be addressed"

# Run unit tests
echo "Running unit tests..."
npm test || echo "Some tests failed, please check the output above"

# Check for common issues in React Native projects
echo "Checking for common React Native issues..."

# Check for console.log statements (should be removed in production)
echo "Checking for console.log statements..."
grep -r "console.log" --include="*.ts" --include="*.tsx" src/ | wc -l

# Check for memory leaks in useEffect hooks (missing dependency arrays or cleanup functions)
echo "Checking for potential memory leaks in useEffect hooks..."
grep -r "useEffect" --include="*.tsx" src/ | grep -v "return" | wc -l

# Check for hardcoded strings (should be in a constants file)
echo "Checking for hardcoded strings..."
grep -r "\"" --include="*.tsx" src/ | grep -v "import" | grep -v "require" | wc -l

# Check for accessibility issues
echo "Checking for accessibility issues..."
grep -r "accessibilityLabel" --include="*.tsx" src/ | wc -l

# Check for performance optimizations
echo "Checking for React.memo usage for performance optimization..."
grep -r "React.memo" --include="*.tsx" src/ | wc -l

# Check for proper error handling
echo "Checking for try/catch blocks for error handling..."
grep -r "try {" --include="*.ts" --include="*.tsx" src/ | wc -l

echo "Test suite completed. Please review the results above."
