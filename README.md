# Ironbean

[![npm version](https://img.shields.io/npm/v/ironbean.svg)](https://www.npmjs.com/package/ironbean)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ironbean is a modern dependency injection (DI) library for TypeScript and JavaScript with strong type safety, testing support, and React integration.

## Why Ironbean?

Ironbean was created to provide a robust DI solution for TypeScript that other libraries lacked:

- ✅ **Type Safety** - Full TypeScript support with type inference
- ✅ **Test Environment** - Built-in testing utilities for Jasmine and Jest
- ✅ **Easy to Use** - Clean, intuitive API
- ✅ **React Integration** - First-class React support with hooks
- ✅ **Scopes** - Advanced scope management for complex applications
- ✅ **Modern** - Actively maintained and up-to-date

## Table of Contents

- [Installation](#installation)
- [Packages](#packages)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Class Components](#class-components)
  - [Dependency Tokens](#dependency-tokens)
  - [Component Types](#component-types)
  - [Injection Methods](#injection-methods)
  - [ApplicationContext](#applicationcontext)
  - [Scopes](#scopes)
  - [Collections](#collections)
  - [Lazy Injection](#lazy-injection)
- [React Integration](#react-integration)
- [React Router Integration](#react-router-integration)
- [Testing](#testing)
- [Configuration](#configuration)
- [Advanced Topics](#advanced-topics)
- [Examples](#examples)
- [API Reference](#api-reference)

## Installation

### Core Library

```bash
npm install --save ironbean
```

Configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Additional Packages

```bash
# React integration
npm install --save ironbean-react

# React Router integration
npm install --save ironbean-react-router

# Testing utilities for Jest
npm install --save-dev ironbean-jest

# Testing utilities for Jasmine
npm install --save-dev ironbean-jasmine

# TypeScript transformer (optional)
npm install --save-dev ironbean-ts-transformer
```

## Packages

This repository is a monorepo containing the following packages:

| Package | Version | Description |
|---------|---------|-------------|
| [ironbean](/packages/ironbean) | 1.0.22 | Core dependency injection library |
| [ironbean-react](/packages/ironbean-react) | 1.0.2 | React integration with hooks and context providers |
| [ironbean-react-router](/packages/ironbean-react-router) | 0.0.14 | React Router integration with scope management |
| [ironbean-jest](/packages/ironbean-jest) | 1.0.1 | Testing utilities for Jest |
| [ironbean-jasmine](/packages/ironbean-jasmine) | 1.0.1 | Testing utilities for Jasmine |
| [ironbean-ts-transformer](/packages/ironbean-ts-transformer) | 1.0.0 | TypeScript transformer for enhanced DI features |

## Quick Start

```typescript
import { component, autowired, getBaseApplicationContext } from 'ironbean';

// Define a component
@component
class Logger {
  log(message: string) {
    console.log(message);
  }
}

// Use dependency injection
@component
class Application {
  @autowired
  private logger!: Logger;

  run() {
    this.logger.log('Application started!');
  }
}

// Bootstrap the application
const context = getBaseApplicationContext();
const app = context.getBean(Application);
app.run();
```

## Core Concepts

### Class Components

Components are classes that Ironbean can instantiate and manage. Mark a class as a component using the `@component` decorator:

```typescript
@component
class DatabaseService {
  private connection: Connection;

  constructor() {
    // Initialization logic
  }

  query(sql: string) {
    // Query implementation
  }
}
```

### Dependency Tokens

Dependency tokens identify dependencies that cannot be identified by class alone, such as interfaces:

```typescript
import { DependencyToken } from 'ironbean';

interface IUserRepository {
  findById(id: string): User;
  save(user: User): void;
}

// Create a token for the interface
const IUserRepository = DependencyToken.create<IUserRepository>('USER_REPOSITORY');

// Use the token with @type decorator
@component
class UserService {
  constructor(@type(IUserRepository) private repository: IUserRepository) {}
}

// Bind the token to an implementation
take(IUserRepository).bindTo(DatabaseUserRepository);
```

### Component Types

Ironbean supports two component types:

#### Singleton (Default)

One instance shared across the entire application:

```typescript
@component
class ConfigService {
  // Singleton by default - only one instance created
}
```

#### Prototype

New instance created for each injection:

```typescript
import { ComponentType, take } from 'ironbean';

@component
class RequestHandler {
  // Configure as prototype
}

take(RequestHandler).setType(ComponentType.Prototype);
```

### Injection Methods

Ironbean supports multiple ways to inject dependencies:

#### 1. Constructor Injection

The most common and recommended approach:

```typescript
@component
class Engine {
  start() {
    console.log('Engine started');
  }
}

@component
class Car {
  constructor(private engine: Engine) {}

  drive() {
    this.engine.start();
  }
}
```

With dependency tokens:

```typescript
@component
class TodoList {
  constructor(@type(ITodoStorage) private storage: ITodoStorage) {}
}
```

#### 2. Property Injection

Using the `@autowired` decorator:

```typescript
@component
class Car {
  @autowired
  private engine!: Engine;
}
```

Or using the `inject()` function:

```typescript
@component
class Car {
  private engine = inject(Engine);
}
```

#### 3. Method Injection

Using `@postConstruct` for initialization after construction:

```typescript
@component
class Car {
  private engine!: Engine;

  @postConstruct
  initialize(engine: Engine) {
    this.engine = engine;
    // Additional initialization logic
  }
}
```

#### 4. Context Injection (Not Recommended)

Direct access to the context (use sparingly):

```typescript
@component
class Factory {
  constructor(private context: ApplicationContext) {}

  createInstance() {
    // Anti-pattern: only use when necessary
    return this.context.getBean(SomeComponent);
  }
}
```

### ApplicationContext

The ApplicationContext is the main interface for interacting with the DI container:

```typescript
import { getBaseApplicationContext } from 'ironbean';

// Get the global context
const context = getBaseApplicationContext();

// Retrieve a bean
const service = context.getBean(MyService);

// Create a child context with a scope
const childContext = context.createOrGetParentContext(myScope);
```

### Scopes

Scopes allow you to create hierarchical contexts with different lifecycles:

```typescript
import { Scope, scope, needScope, provideScope } from 'ironbean';

// Create a scope
const RequestScope = Scope.create('request');

// Mark a component as requiring a scope
@component
@scope(RequestScope)
class RequestService {
  // This component belongs to RequestScope
}

// Provide a scope for dependency resolution
@component
@provideScope(RequestScope)
class RequestHandler {
  @autowired
  private requestService!: RequestService;
}

// Or require a scope to be present
@component
@needScope(RequestScope)
class ContextualService {
  // This component needs RequestScope to exist
}
```

### Collections

Inject all implementations of a token as an array:

```typescript
import { collection, DependencyToken } from 'ironbean';

interface IPlugin {
  execute(): void;
}

const IPlugin = DependencyToken.create<IPlugin>('PLUGIN');

@component
class PluginManager {
  @collection(IPlugin)
  private plugins!: IPlugin[];

  executeAll() {
    this.plugins.forEach(plugin => plugin.execute());
  }
}

// Register multiple implementations
@component
class Plugin1 implements IPlugin {
  execute() { console.log('Plugin 1'); }
}
take(IPlugin).bindTo(Plugin1);

@component
class Plugin2 implements IPlugin {
  execute() { console.log('Plugin 2'); }
}
take(IPlugin).bindTo(Plugin2);
```

### Lazy Injection

Defer dependency resolution until first access:

```typescript
import { lazy, inject } from 'ironbean';

@component
class ExpensiveService {
  // Heavy initialization
}

@component
class Application {
  // Using decorator
  @lazy
  private service!: ExpensiveService;

  // Or using inject.lazy()
  private otherService = inject.lazy(ExpensiveService);

  someMethod() {
    // Service is only instantiated when first accessed
    this.service.doSomething();
  }
}
```

## React Integration

The `ironbean-react` package provides seamless React integration:

### useBean Hook

```typescript
import { useBean } from 'ironbean-react';

function MyComponent() {
  const userService = useBean(UserService);

  useEffect(() => {
    userService.loadUsers();
  }, []);

  return <div>...</div>;
}
```

### Context Provider

Provide a specific ApplicationContext to a React tree:

```typescript
import { ContextProvider } from 'ironbean-react';

function App() {
  const context = getBaseApplicationContext();

  return (
    <ContextProvider context={context}>
      <MyComponent />
    </ContextProvider>
  );
}
```

### withContext HOC

Wrap class components to inject context:

```typescript
import { withContext } from 'ironbean-react';
import { component, autowired } from 'ironbean';

@component
class MyClassComponent extends React.Component {
  @autowired
  private userService!: UserService;

  render() {
    return <div>...</div>;
  }
}

export default withContext()(MyClassComponent);
```

## React Router Integration

The `ironbean-react-router` package integrates with React Router to manage scopes based on routes:

```typescript
import { IronRouter, RouterResolver, IRouterResolver } from 'ironbean-react-router';
import { Scope } from 'ironbean';

// Create scopes for routes
const HomeScope = Scope.create('home');
const ProfileScope = Scope.create('profile');

// Configure route resolver
class MyRouterResolver implements IRouterResolver {
  getSettingsForPath(path: string) {
    if (path.startsWith('/profile')) {
      return { scope: ProfileScope };
    }
    return { scope: HomeScope };
  }

  getBaseScopeForPaths(path1: string, path2: string) {
    // Return common parent scope
    return Scope.getDefault();
  }
}

function App() {
  const resolver = new MyRouterResolver();

  return (
    <BrowserRouter>
      <IronRouter resolver={resolver}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </IronRouter>
    </BrowserRouter>
  );
}
```

Features:
- **Automatic Scope Management** - Scopes are created/destroyed based on route changes
- **Scroll Restoration** - Automatic scroll position restoration
- **State Handlers** - Execute initialization logic when entering routes

## Testing

Ironbean provides excellent testing support with automatic mocking:

### Jest

```typescript
import { getBaseJestTestingContext, JestTestingContext } from 'ironbean-jest';

describe('UserService', () => {
  let context: JestTestingContext;

  beforeEach(() => {
    context = getBaseJestTestingContext();
  });

  it('should load users', () => {
    // Automatically creates mocks for dependencies
    const service = context.getBean(UserService);
    const mockRepository = context.getMock(IUserRepository);

    mockRepository.findAll.mockReturnValue([user1, user2]);

    const users = service.loadUsers();
    expect(users).toHaveLength(2);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });

  it('can override dependencies', () => {
    const mockRepo = { findAll: jest.fn() };
    context.setBean(IUserRepository, mockRepo);

    const service = context.getBean(UserService);
    // service will use mockRepo
  });
});
```

### Jasmine

```typescript
import { getBaseJasmineTestingContext, JasmineTestingContext } from 'ironbean-jasmine';

describe('UserService', () => {
  let context: JasmineTestingContext;

  beforeEach(() => {
    context = getBaseJasmineTestingContext();
  });

  it('should load users', () => {
    const service = context.getBean(UserService);
    const mockRepository = context.getMock(IUserRepository);

    mockRepository.findAll.and.returnValue([user1, user2]);

    const users = service.loadUsers();
    expect(users.length).toBe(2);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
```

### Testing Features

- **Automatic Mocking** - Dependencies are automatically mocked
- **Manual Overrides** - Use `setBean()` to provide custom mocks
- **Type Safety** - Full TypeScript support for mocks
- **Property Mocking** - Support for mocking getters/setters with `getPropertyDescriptor()`

## Configuration

### Binding Tokens to Classes

```typescript
import { take } from 'ironbean';

take(IUserRepository).bindTo(DatabaseUserRepository);
```

### Setting Factories

```typescript
import { take, ComponentContext } from 'ironbean';

take(ILogger).setFactory((context: ComponentContext) => {
  return new ConsoleLogger(context.getBean(Config));
});
```

### Setting Component Type

```typescript
import { take, ComponentType } from 'ironbean';

// Make component a prototype
take(RequestHandler).setType(ComponentType.Prototype);

// Make component a singleton (default)
take(ConfigService).setType(ComponentType.Singleton);
```

### Multiple Configurations

```typescript
// Bind multiple implementations to a token
take(IPlugin).bindTo(PluginA);
take(IPlugin).bindTo(PluginB);
take(IPlugin).bindTo(PluginC);

// Inject all as a collection
@component
class PluginManager {
  @collection(IPlugin)
  private plugins!: IPlugin[]; // [PluginA, PluginB, PluginC]
}
```

## Advanced Topics

### Creating Custom Contexts

```typescript
import { createBaseApplicationContext, destroyContext } from 'ironbean';

// Create a new isolated context
const customContext = createBaseApplicationContext();

// Use the context
const service = customContext.getBean(MyService);

// Clean up when done
destroyContext();
```

### Hierarchical Scopes

```typescript
const AppScope = Scope.create('app');
const RequestScope = AppScope.createScope('request');
const TaskScope = RequestScope.createScope('task');

// Check scope hierarchy
RequestScope.isParent(TaskScope); // true
RequestScope.getParent(); // AppScope
```

### Component Context

ComponentContext is used internally for dependency resolution within components:

```typescript
import { ComponentContext, IFactory } from 'ironbean';

take(IDatabase).setFactory((context: ComponentContext): IDatabase => {
  const config = context.getBean(Config);
  return new Database(config.connectionString);
});
```

### TypeScript Transformer

The `ironbean-ts-transformer` package provides enhanced compile-time features (experimental).

## Examples

### Basic Example

```typescript
import { component, autowired, getBaseApplicationContext } from 'ironbean';

@component
class Database {
  query(sql: string) {
    console.log(`Executing: ${sql}`);
  }
}

@component
class UserRepository {
  constructor(private db: Database) {}

  findUser(id: string) {
    this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

@component
class UserService {
  @autowired
  private repository!: UserRepository;

  getUser(id: string) {
    return this.repository.findUser(id);
  }
}

// Bootstrap
const context = getBaseApplicationContext();
const service = context.getBean(UserService);
service.getUser('123');
```

### Interface Example

```typescript
import { component, type, DependencyToken, take } from 'ironbean';

interface IEmailService {
  send(to: string, subject: string, body: string): void;
}

const IEmailService = DependencyToken.create<IEmailService>('EMAIL_SERVICE');

@component
class SmtpEmailService implements IEmailService {
  send(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
  }
}

@component
class NotificationService {
  constructor(@type(IEmailService) private emailService: IEmailService) {}

  notifyUser(email: string) {
    this.emailService.send(email, 'Notification', 'You have a new notification');
  }
}

// Configuration
take(IEmailService).bindTo(SmtpEmailService);
```

### Scope Example

```typescript
import { component, scope, Scope, provideScope, autowired } from 'ironbean';

const RequestScope = Scope.create('request');

@component
@scope(RequestScope)
class RequestContext {
  readonly id = Math.random().toString(36);
}

@component
@provideScope(RequestScope)
class RequestHandler {
  @autowired
  private context!: RequestContext;

  handle() {
    console.log(`Handling request ${this.context.id}`);
  }
}
```

### React Example

```typescript
import React, { useEffect, useState } from 'react';
import { component } from 'ironbean';
import { useBean } from 'ironbean-react';

@component
class UserService {
  async loadUsers() {
    // API call
    return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
  }
}

function UserList() {
  const userService = useBean(UserService);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.loadUsers().then(setUsers);
  }, [userService]);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## API Reference

### Decorators

- `@component` - Mark a class as a component
- `@autowired` - Inject a dependency into a property
- `@type(token)` - Specify the dependency token for injection
- `@postConstruct` - Mark a method to be called after construction
- `@scope(scope)` - Assign a component to a scope
- `@needScope(scope)` - Require a scope to be present
- `@provideScope(scope)` - Provide a scope for child dependencies
- `@collection(token)` - Inject all implementations as an array
- `@lazy` - Defer dependency resolution until first access

### Functions

- `getBaseApplicationContext()` - Get the global ApplicationContext
- `createBaseApplicationContext()` - Create a new isolated ApplicationContext
- `destroyContext()` - Clean up the current context
- `take(dependency)` - Configure a dependency
- `inject(dependency)` - Inject a dependency (property initializer)
- `inject.lazy(dependency)` - Lazy inject a dependency

### Classes

- `DependencyToken<T>` - Create a token for non-class dependencies
- `ApplicationContext` - Main DI container interface
- `ComponentContext` - Context for component resolution
- `Scope` - Scope management
- `TestingContext` - Base testing context (ironbean-jest/jasmine)

### Types

- `ComponentType.Singleton` - One instance per context
- `ComponentType.Prototype` - New instance per injection
- `Dependency<T>` - Union of class constructor or DependencyToken

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT © Zdeněk Mazurák

## Repository

https://github.com/killov/ironbean

## Author

Zdeněk Mazurák
