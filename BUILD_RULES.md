# MoodFlix Mobile Build Rules

## Development Guidelines

### 1. Feature Completion
- Complete one feature at a time
- Finish UI, logic, and testing together
- No partial implementations
- No starting multiple features simultaneously

### 2. Feature Scope Definition
Before coding any feature, document:
```markdown
Feature: [Feature Name]
Scope:
- Components/Screens: [List]
- Inputs: [List]
- Outputs: [List]
- Edge Cases: [List]
- Dependencies: [List]
```

### 3. File Completeness
- No partial files
- No empty screens
- No stub functions
- Every file must be:
  - Fully functional
  - Tested
  - Importable
  - Documented

### 4. Dependency Management
- Resolve dependencies immediately
- Create required modules first
- Use clear mocks with TODOs if needed
- No undefined imports
- No "TBD" references

### 5. Build Stability
- Maintain working app state
- Update all references when changing major packages
- No broken builds
- No partial migrations

### 6. Code Style
```typescript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}

// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 7. Project Structure
```
src/
├── screens/
│   └── [ScreenName]/
│       ├── index.tsx
│       ├── styles.ts
│       ├── types.ts
│       └── tests/
├── components/
│   └── [ComponentName]/
│       ├── index.tsx
│       ├── styles.ts
│       ├── types.ts
│       └── tests/
```

### 8. Testing Requirements
Before moving to next feature:
- [ ] Run the app
- [ ] Verify feature functionality
- [ ] Check for console errors
- [ ] Test edge cases
- [ ] Verify no crashes
- [ ] Document test results

### 9. Version Control
After each feature:
- [ ] All tests pass
- [ ] No console errors
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Feature branch merged

### 10. Change Management
- Only modify files related to current task
- No unrelated refactoring
- No random dependency updates
- Document all changes in PR

## Feature Development Checklist

### Pre-Development
- [ ] Feature scope documented
- [ ] Dependencies identified
- [ ] Test cases defined
- [ ] UI mockups approved

### During Development
- [ ] Follow code style
- [ ] Write tests
- [ ] Document changes
- [ ] Resolve dependencies
- [ ] Handle edge cases

### Post-Development
- [ ] Run all tests
- [ ] Update documentation
- [ ] Clean up code
- [ ] Review changes
- [ ] Create PR

## Code Review Checklist

### General
- [ ] Follows project structure
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation complete
- [ ] Tests included

### Performance
- [ ] No memory leaks
- [ ] Optimized renders
- [ ] Proper cleanup
- [ ] Efficient data handling

### Security
- [ ] No sensitive data exposure
- [ ] Proper authentication
- [ ] Input validation
- [ ] Error handling

## Build Process

### Development
```bash
# Start development
npm run start

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Production
```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android

# Deploy
npm run deploy
```

## Error Handling

### Required Error Types
```typescript
interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
```

### Error Logging
- Use centralized error logging
- Include stack traces
- Add user context
- Log to appropriate level

## Documentation Requirements

### Code Documentation
- JSDoc for all functions
- Type definitions for all props
- Component usage examples
- Test coverage reports

### Feature Documentation
- Setup instructions
- Usage examples
- Edge cases
- Known limitations

## Monitoring

### Required Metrics
- Error rates
- Performance metrics
- User engagement
- Feature usage

### Alert Thresholds
- Error rate > 1%
- Response time > 2s
- Crash rate > 0.1%
- Memory usage > 80% 