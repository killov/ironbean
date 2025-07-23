# Ironbean Documentation

Welcome to the comprehensive documentation for Ironbean - a powerful dependency injection library for TypeScript and JavaScript.

## 🚀 Quick Start

```bash
npm install --save ironbean
```

```typescript
import 'reflect-metadata';
import { component, autowired, getBaseApplicationContext } from 'ironbean';

@component
class GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

@component
class App {
  @autowired
  private greetingService: GreetingService;
  
  run(): void {
    console.log(this.greetingService.greet('World'));
  }
}

const context = getBaseApplicationContext();
const app = context.getBean(App);
app.run(); // Output: Hello, World!
```

## 📚 Documentation Structure

### Core Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation for all packages
- **[Getting Started Guide](./GETTING_STARTED.md)** - Step-by-step tutorial from basics to advanced
- **[Examples](./EXAMPLES.md)** - Real-world application examples and patterns

### Package-Specific Guides

- **[Core Package (`ironbean`)](./packages/IRONBEAN.md)** - Dependency injection fundamentals
- **[React Integration (`ironbean-react`)](./packages/IRONBEAN_REACT.md)** - React hooks and components
- **[React Router (`ironbean-react-router`)](./packages/IRONBEAN_REACT_ROUTER.md)** - Router integration with scopes
- **[Testing (`ironbean-jasmine`)](./packages/IRONBEAN_JASMINE.md)** - Testing utilities and mocking

### Advanced Topics

- **[Architecture Patterns](./advanced/ARCHITECTURE_PATTERNS.md)** - Design patterns and best practices
- **[Migration Guide](./advanced/MIGRATION_GUIDE.md)** - Upgrading and migration strategies
- **[Performance Guide](./advanced/PERFORMANCE.md)** - Optimization and performance tips
- **[Troubleshooting](./advanced/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ What is Ironbean?

Ironbean is a modern dependency injection library designed for TypeScript and JavaScript applications. It provides:

### ✨ Key Features

- **Type Safety** - Full TypeScript support with compile-time type checking
- **Decorator Support** - Clean, declarative syntax using decorators
- **React Integration** - First-class React support with hooks and context providers
- **Testing Support** - Built-in mocking and testing utilities
- **Scope Management** - Flexible component lifecycle management
- **Interface Binding** - Support for interface-based dependency injection
- **Framework Agnostic** - Works with any JavaScript/TypeScript framework

### 🎯 Use Cases

- **Web Applications** - Frontend React applications with complex state management
- **API Services** - Backend Node.js services with layered architecture
- **Testing** - Unit and integration testing with automatic mocking
- **Microservices** - Distributed systems with consistent dependency management

## 📦 Package Overview

### Core Package (`ironbean`)

The foundation package providing dependency injection capabilities:

```typescript
import { component, autowired, DependencyToken } from 'ironbean';
```

**Key Features:**
- Component registration and lifecycle management
- Constructor, property, and method injection
- Interface-based dependencies with tokens
- Scope management for component lifecycles
- Factory functions for complex instantiation

### React Integration (`ironbean-react`)

Seamless React integration with hooks and context providers:

```typescript
import { useBean, ContextProvider } from 'ironbean-react';
```

**Key Features:**
- `useBean` hook for functional components
- `@withContext` decorator for class components
- Context providers for dependency injection trees
- Automatic re-rendering on dependency changes

### React Router Integration (`ironbean-react-router`)

Advanced routing with scope-based dependency management:

```typescript
import { IronRouter, RouterResolver } from 'ironbean-react-router';
```

**Key Features:**
- Route-based scope management
- State handlers for navigation events
- Scroll restoration
- Hierarchical scope inheritance

### Testing Support (`ironbean-jasmine`)

Comprehensive testing utilities with automatic mocking:

```typescript
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
```

**Key Features:**
- Automatic mock generation
- Interface mocking with proper typing
- Property descriptor access for getters/setters
- Integration with popular testing frameworks

## 🚀 Getting Started

### 1. Installation

Choose the packages you need:

```bash
# Core package (required)
npm install --save ironbean

# React integration (optional)
npm install --save ironbean-react

# React Router integration (optional)
npm install --save ironbean-react-router

# Testing support (optional)
npm install --save-dev ironbean-jasmine

# Required for TypeScript
npm install --save reflect-metadata
```

### 2. TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. Basic Setup

```typescript
// main.ts
import 'reflect-metadata';
import { component, autowired, getBaseApplicationContext } from 'ironbean';

@component
class DatabaseService {
  connect(): string {
    return 'Connected to database';
  }
}

@component
class UserService {
  @autowired
  private database: DatabaseService;
  
  getUsers(): string[] {
    console.log(this.database.connect());
    return ['Alice', 'Bob', 'Charlie'];
  }
}

// Initialize application
const context = getBaseApplicationContext();
const userService = context.getBean(UserService);
console.log(userService.getUsers());
```

### 4. React Application

```typescript
// App.tsx
import React from 'react';
import { ContextProvider, useBean } from 'ironbean-react';
import { getBaseApplicationContext } from 'ironbean';

const UserList: React.FC = () => {
  const userService = useBean(UserService);
  const [users, setUsers] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    setUsers(userService.getUsers());
  }, [userService]);
  
  return (
    <ul>
      {users.map(user => <li key={user}>{user}</li>)}
    </ul>
  );
};

const App: React.FC = () => {
  const context = getBaseApplicationContext();
  
  return (
    <ContextProvider context={context}>
      <UserList />
    </ContextProvider>
  );
};
```

## 📖 Learning Path

### Beginner
1. Read the [Getting Started Guide](./GETTING_STARTED.md)
2. Follow the basic examples
3. Understand component registration and injection

### Intermediate
1. Learn interface-based dependencies
2. Explore scope management
3. Integrate with React applications

### Advanced
1. Study the [Examples](./EXAMPLES.md) for real-world patterns
2. Read [Architecture Patterns](./advanced/ARCHITECTURE_PATTERNS.md)
3. Implement testing strategies

## 🔗 Quick Links

### Documentation
- [Complete API Reference](./API_REFERENCE.md)
- [Step-by-Step Tutorial](./GETTING_STARTED.md)
- [Real-World Examples](./EXAMPLES.md)

### Packages
- [Core Package Guide](./packages/IRONBEAN.md)
- [React Integration Guide](./packages/IRONBEAN_REACT.md)
- [Testing Guide](./packages/IRONBEAN_JASMINE.md)

### Resources
- [Architecture Patterns](./advanced/ARCHITECTURE_PATTERNS.md)
- [Performance Tips](./advanced/PERFORMANCE.md)
- [Troubleshooting](./advanced/TROUBLESHOOTING.md)

## 🛠️ Common Patterns

### Service Layer Architecture

```typescript
// Define interfaces
interface IUserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<User>;
}

const IUserRepository = DependencyToken.create<IUserRepository>('USER_REPOSITORY');

// Implement services
@component
class UserService {
  constructor(@type(IUserRepository) private repo: IUserRepository) {}
  
  async getUser(id: string): Promise<User> {
    return this.repo.findById(id);
  }
}

// Configure bindings
take(IUserRepository).bindTo(DatabaseUserRepository);
```

### React State Management

```typescript
@component
class UserStore {
  @observable users: User[] = [];
  @autowired private userService: UserService;
  
  @action
  async loadUsers(): Promise<void> {
    this.users = await this.userService.getAllUsers();
  }
}

// Use in components
const UserComponent: React.FC = observer(() => {
  const userStore = useBean(UserStore);
  
  React.useEffect(() => {
    userStore.loadUsers();
  }, []);
  
  return <div>{userStore.users.length} users</div>;
});
```

### Testing with Mocks

```typescript
describe('UserService', () => {
  let context: JasmineTestingContext;
  let userService: UserService;
  let mockRepo: jasmine.SpyObj<IUserRepository>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    userService = context.getBean(UserService);
    mockRepo = context.getMock(IUserRepository);
  });
  
  it('should get user by id', async () => {
    const mockUser = { id: '1', name: 'John' };
    mockRepo.findById.and.returnValue(Promise.resolve(mockUser));
    
    const result = await userService.getUser('1');
    
    expect(result).toEqual(mockUser);
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });
});
```

## 🔄 Version Compatibility

| Ironbean Version | TypeScript | React | Node.js |
|------------------|------------|-------|---------|
| 1.x              | ≥ 3.7      | ≥ 16  | ≥ 12    |
| 2.x              | ≥ 4.0      | ≥ 17  | ≥ 14    |

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Setting up the development environment
- Running tests
- Submitting pull requests
- Reporting issues

## 📄 License

Ironbean is released under the MIT License. See the LICENSE file for details.

## 🔗 Related Projects

- **Spring Framework** - Inspiration for dependency injection patterns
- **InversifyJS** - Alternative DI library for TypeScript
- **TSyringe** - Another TypeScript DI container

---

**Need Help?** Start with the [Getting Started Guide](./GETTING_STARTED.md) or browse the [Examples](./EXAMPLES.md) for your use case.