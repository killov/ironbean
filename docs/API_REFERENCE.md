# Ironbean API Reference

Ironbean is a dependency injection library for TypeScript and JavaScript with comprehensive support for React, React Router, and testing frameworks.

## Table of Contents

- [Core Package (`ironbean`)](#core-package-ironbean)
  - [Decorators](#decorators)
  - [Configuration Functions](#configuration-functions)
  - [Context Management](#context-management)
  - [Dependency Tokens](#dependency-tokens)
  - [Types and Interfaces](#types-and-interfaces)
  - [Testing Support](#testing-support)
- [React Integration (`ironbean-react`)](#react-integration-ironbean-react)
- [React Router Integration (`ironbean-react-router`)](#react-router-integration-ironbean-react-router)
- [Testing Integration (`ironbean-jasmine`)](#testing-integration-ironbean-jasmine)
- [Complete Examples](#complete-examples)

---

## Core Package (`ironbean`)

### Decorators

#### `@component`

Marks a class as a component that can be managed by the dependency injection container.

**Syntax:**
```typescript
@component
class MyService { }

// Or with component type
@component(ComponentType.Prototype)
class MyPrototypeService { }
```

**Parameters:**
- `componentType` (optional): `ComponentType.Singleton` (default) or `ComponentType.Prototype`

**Example:**
```typescript
import { component, ComponentType } from 'ironbean';

@component
class DatabaseService {
  connect() {
    // Database connection logic
  }
}

@component(ComponentType.Prototype)
class RequestHandler {
  private requestId = Math.random();
  
  handle(request: any) {
    console.log(`Handling request with ID: ${this.requestId}`);
  }
}
```

#### `@autowired`

Automatically injects dependencies into class properties.

**Syntax:**
```typescript
@autowired
private dependency: DependencyType;
```

**Example:**
```typescript
import { component, autowired } from 'ironbean';

@component
class UserService {
  @autowired
  private databaseService: DatabaseService;
  
  getUser(id: string) {
    return this.databaseService.findUser(id);
  }
}
```

#### `@type`

Specifies the dependency token for injection when the type cannot be inferred.

**Syntax:**
```typescript
@type(DependencyToken)
parameter: InterfaceType
```

**Example:**
```typescript
import { component, type, DependencyToken } from 'ironbean';

interface ILogger {
  log(message: string): void;
}

const ILogger = DependencyToken.create<ILogger>('LOGGER');

@component
class UserService {
  constructor(@type(ILogger) private logger: ILogger) {
    this.logger.log('UserService initialized');
  }
}
```

#### `@postConstruct`

Marks a method to be called after dependency injection is complete.

**Syntax:**
```typescript
@postConstruct
methodName() { }
```

**Example:**
```typescript
import { component, autowired, postConstruct } from 'ironbean';

@component
class EmailService {
  @autowired
  private configService: ConfigService;
  
  private smtpClient: any;
  
  @postConstruct
  initialize() {
    const config = this.configService.getEmailConfig();
    this.smtpClient = new SMTPClient(config);
  }
}
```

#### `@scope`

Defines the scope for a component.

**Syntax:**
```typescript
@scope(ScopeInstance)
class MyComponent { }
```

**Example:**
```typescript
import { component, scope, Scope } from 'ironbean';

const REQUEST_SCOPE = Scope.create('REQUEST');

@component
@scope(REQUEST_SCOPE)
class RequestContextService {
  private requestData: any = {};
  
  setData(key: string, value: any) {
    this.requestData[key] = value;
  }
}
```

### Configuration Functions

#### `take(dependency)`

Provides configuration options for dependencies.

**Returns:** Configuration object with methods:
- `bindTo(implementation)`: Binds a token to a concrete implementation
- `setFactory(factory)`: Sets a factory function for creating instances
- `setType(componentType)`: Sets the component type (Singleton/Prototype)

**Example:**
```typescript
import { take, DependencyToken, ComponentType } from 'ironbean';

interface IPaymentProcessor {
  processPayment(amount: number): Promise<boolean>;
}

const IPaymentProcessor = DependencyToken.create<IPaymentProcessor>('PAYMENT_PROCESSOR');

@component
class StripePaymentProcessor implements IPaymentProcessor {
  async processPayment(amount: number): Promise<boolean> {
    // Stripe implementation
    return true;
  }
}

// Bind interface to implementation
take(IPaymentProcessor).bindTo(StripePaymentProcessor);

// Or use a factory
take(IPaymentProcessor).setFactory((context) => {
  const apiKey = context.getBean(ConfigService).getStripeKey();
  return new StripePaymentProcessor(apiKey);
});

// Set component type
take(SomeService).setType(ComponentType.Prototype);
```

### Context Management

#### `getBaseApplicationContext()`

Gets the base application context for dependency resolution.

**Returns:** `ApplicationContext`

**Example:**
```typescript
import { getBaseApplicationContext } from 'ironbean';

const context = getBaseApplicationContext();
const userService = context.getBean(UserService);
userService.processUsers();
```

#### `createBaseApplicationContext()`

Creates a new base application context.

**Returns:** `ApplicationContext`

#### `destroyContext()`

Destroys the current context and cleans up resources.

#### `ApplicationContext`

Main interface for dependency resolution.

**Methods:**
- `getBean<T>(dependency: Dependency<T>): T` - Resolves and returns a dependency
- `createOrGetParentContext(scope: Scope): ApplicationContext` - Creates or gets a context for a specific scope

**Example:**
```typescript
import { ApplicationContext, component } from 'ironbean';

@component
class OrderService {
  constructor(private context: ApplicationContext) {}
  
  processOrder(orderId: string) {
    // Get dependencies as needed
    const paymentService = this.context.getBean(PaymentService);
    const inventoryService = this.context.getBean(InventoryService);
    
    // Process order...
  }
}
```

#### `ComponentContext`

Context used within components for dependency resolution. Similar to ApplicationContext but optimized for component use.

### Dependency Tokens

#### `DependencyToken.create<T>(name)`

Creates a new dependency token for interface or abstract types.

**Parameters:**
- `name`: String identifier for the token

**Returns:** `DependencyToken<T>`

**Example:**
```typescript
import { DependencyToken } from 'ironbean';

interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

const IEmailService = DependencyToken.create<IEmailService>('EMAIL_SERVICE');

// Use in components
@component
class NotificationService {
  constructor(@type(IEmailService) private emailService: IEmailService) {}
  
  async sendWelcomeEmail(userEmail: string) {
    await this.emailService.sendEmail(
      userEmail,
      'Welcome!',
      'Thank you for joining our service.'
    );
  }
}
```

### Injection Functions

#### `inject(dependency)`

Function-based dependency injection as an alternative to decorators.

**Example:**
```typescript
import { inject, component } from 'ironbean';

@component
class OrderService {
  private paymentService = inject(PaymentService);
  private inventoryService = inject(InventoryService);
  
  processOrder() {
    // Use injected services
  }
}
```

#### `inject.lazy(dependency)`

Lazy dependency injection - the dependency is resolved when first accessed.

**Example:**
```typescript
import { inject, component } from 'ironbean';

@component
class ReportService {
  private heavyService = inject.lazy(HeavyComputationService);
  
  generateReport() {
    // heavyService is only created when accessed
    return this.heavyService.computeReport();
  }
}
```

### Scopes

#### `Scope`

Defines the lifecycle and hierarchy of component instances.

**Static Methods:**
- `Scope.create(name: string): Scope` - Creates a new scope
- `Scope.getDefault(): Scope` - Gets the default scope

**Instance Methods:**
- `getParent(): Scope | undefined` - Gets parent scope
- `isParent(scope: Scope): boolean` - Checks if this scope is parent of another

**Example:**
```typescript
import { Scope, component, scope } from 'ironbean';

const REQUEST_SCOPE = Scope.create('REQUEST');
const SESSION_SCOPE = Scope.create('SESSION');

@component
@scope(REQUEST_SCOPE)
class RequestService {
  private requestId = Math.random();
}

@component
@scope(SESSION_SCOPE)
class SessionService {
  private sessionData: Record<string, any> = {};
}
```

### Types and Interfaces

#### `ComponentType`

Enumeration of component lifecycle types:
- `ComponentType.Singleton` - One instance per container
- `ComponentType.Prototype` - New instance for each injection

#### `Dependency<T>`

Type alias for any dependency that can be injected:
```typescript
type Dependency<T> = TClass<T> | DependencyToken<T> | LazyToken<T>;
```

#### `IFactory<T>`

Interface for factory classes:
```typescript
interface IFactory<T> {
  create(...args: any[]): T;
}
```

### Testing Support

#### `getBaseTestingContext()`

Gets a testing context with mocking capabilities.

**Returns:** `TestingContext`

#### `TestingContext`

Extended context for testing with additional methods:
- `getMock<T>(dependency: Dependency<T>): MockedType<T>` - Gets a mock for a dependency
- `getBean<T>(dependency: Dependency<T>): T` - Gets a bean (same as ApplicationContext)

---

## React Integration (`ironbean-react`)

### Hooks

#### `useBean<T>(dependency: Dependency<T>): T`

React hook for injecting dependencies into functional components.

**Example:**
```typescript
import React from 'react';
import { useBean } from 'ironbean-react';
import { UserService } from './services/UserService';

const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const userService = useBean(UserService);
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    userService.getUser(userId).then(setUser);
  }, [userId, userService]);
  
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
};
```

### Components

#### `ContextProvider`

Provides an application context to React component tree.

**Props:**
- `context: ApplicationContext` - The context to provide
- `children: ReactNode` - Child components

**Example:**
```typescript
import React from 'react';
import { ContextProvider } from 'ironbean-react';
import { getBaseApplicationContext } from 'ironbean';

const App: React.FC = () => {
  const context = getBaseApplicationContext();
  
  return (
    <ContextProvider context={context}>
      <UserProfile userId="123" />
    </ContextProvider>
  );
};
```

### Higher-Order Components

#### `withContext()`

Higher-order component that provides dependency injection context to class components.

**Example:**
```typescript
import React from 'react';
import { withContext } from 'ironbean-react';
import { autowired } from 'ironbean';

@withContext()
class UserProfileClass extends React.Component<{ userId: string }> {
  @autowired
  private userService: UserService;
  
  render() {
    return <div>User Profile</div>;
  }
}
```

---

## React Router Integration (`ironbean-react-router`)

### Components

#### `IronRouter`

Enhanced router that integrates dependency injection with React Router for scope-based navigation.

**Props:**
- `resolver: IRouterResolver` - Router resolver for path-to-scope mapping
- `children: ReactNode` - Child components

**Example:**
```typescript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { IronRouter, RouterResolver } from 'ironbean-react-router';
import { Scope } from 'ironbean';

const PAGE_SCOPE = Scope.create('PAGE');
const ADMIN_SCOPE = Scope.create('ADMIN');

const App: React.FC = () => {
  const resolver = RouterResolver.create([
    { scope: PAGE_SCOPE, path: /^\/pages/ },
    { scope: ADMIN_SCOPE, path: /^\/admin/ }
  ]);
  
  return (
    <BrowserRouter>
      <IronRouter resolver={resolver}>
        {/* Your routes */}
      </IronRouter>
    </BrowserRouter>
  );
};
```

### Classes

#### `RouterResolver`

Resolves paths to scopes and state handlers.

**Static Methods:**
- `RouterResolver.create(items: PathItem[]): RouterResolver`

**Instance Methods:**
- `getSettingsForPath(path: string): PathSettings`
- `getBaseScopeForPaths(path1: string, path2: string): Scope`

**Types:**
```typescript
interface PathItem {
  scope: Scope;
  path: RegExp;
  handler?: Dependency<StateHandler>;
}

interface PathSettings {
  scope: Scope;
  stateHandler?: Dependency<StateHandler>;
}

interface StateHandler {
  init?(): void;
}
```

### Hooks

#### `useHistory()`

Gets the history object for programmatic navigation.

**Example:**
```typescript
import { useHistory } from 'ironbean-react-router';

const NavigationComponent: React.FC = () => {
  const history = useHistory();
  
  const navigateToPage = () => {
    history.push('/new-page');
  };
  
  return <button onClick={navigateToPage}>Navigate</button>;
};
```

---

## Testing Integration (`ironbean-jasmine`)

### Functions

#### `getBaseJasmineTestingContext()`

Gets a Jasmine-specific testing context with enhanced mocking.

**Returns:** `JasmineTestingContext`

**Example:**
```typescript
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';

describe('UserService', () => {
  let context: JasmineTestingContext;
  let userService: UserService;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    userService = context.getBean(UserService);
  });
  
  it('should create user', () => {
    const mockDb = context.getMock(DatabaseService);
    mockDb.save.and.returnValue(Promise.resolve());
    
    // Test logic
  });
});
```

### Utilities

#### `getPropertyDescriptor<T, K>(object: SpyObj<T>, property: K)`

Gets property descriptor for spied objects to access getters/setters.

**Example:**
```typescript
import { getPropertyDescriptor } from 'ironbean-jasmine';

const mockService = context.getMock(ConfigService);
const configDescriptor = getPropertyDescriptor(mockService, 'config');
configDescriptor.get.and.returnValue({ apiUrl: 'test-url' });
```

---

## Complete Examples

### Basic Service Setup

```typescript
// services/UserService.ts
import { component, autowired } from 'ironbean';

@component
export class UserService {
  @autowired
  private databaseService: DatabaseService;
  
  @autowired
  private emailService: EmailService;
  
  async createUser(userData: UserData): Promise<User> {
    const user = await this.databaseService.save(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}

// main.ts
import { getBaseApplicationContext } from 'ironbean';
import { UserService } from './services/UserService';

const context = getBaseApplicationContext();
const userService = context.getBean(UserService);

userService.createUser({
  name: 'John Doe',
  email: 'john@example.com'
});
```

### React Application with DI

```typescript
// App.tsx
import React from 'react';
import { ContextProvider, useBean } from 'ironbean-react';
import { getBaseApplicationContext } from 'ironbean';

const UserList: React.FC = () => {
  const userService = useBean(UserService);
  const [users, setUsers] = React.useState([]);
  
  React.useEffect(() => {
    userService.getAllUsers().then(setUsers);
  }, [userService]);
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
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

### Interface-Based Injection

```typescript
// interfaces/IEmailService.ts
import { DependencyToken } from 'ironbean';

export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export const IEmailService = DependencyToken.create<IEmailService>('EMAIL_SERVICE');

// services/SmtpEmailService.ts
import { component } from 'ironbean';
import { IEmailService } from '../interfaces/IEmailService';

@component
export class SmtpEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
  }
}

// configuration.ts
import { take } from 'ironbean';
import { IEmailService } from './interfaces/IEmailService';
import { SmtpEmailService } from './services/SmtpEmailService';

take(IEmailService).bindTo(SmtpEmailService);

// services/NotificationService.ts
import { component, type } from 'ironbean';
import { IEmailService } from '../interfaces/IEmailService';

@component
export class NotificationService {
  constructor(@type(IEmailService) private emailService: IEmailService) {}
  
  async notifyUser(userId: string, message: string): Promise<void> {
    const user = await this.userService.getUser(userId);
    await this.emailService.sendEmail(user.email, 'Notification', message);
  }
}
```

### Testing Example

```typescript
// UserService.test.ts
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
import { UserService } from '../services/UserService';
import { DatabaseService } from '../services/DatabaseService';

describe('UserService', () => {
  let context: JasmineTestingContext;
  let userService: UserService;
  let mockDatabase: jasmine.SpyObj<DatabaseService>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    userService = context.getBean(UserService);
    mockDatabase = context.getMock(DatabaseService);
  });
  
  it('should create user successfully', async () => {
    const userData = { name: 'John', email: 'john@test.com' };
    const expectedUser = { id: 1, ...userData };
    
    mockDatabase.save.and.returnValue(Promise.resolve(expectedUser));
    
    const result = await userService.createUser(userData);
    
    expect(result).toEqual(expectedUser);
    expect(mockDatabase.save).toHaveBeenCalledWith(userData);
  });
});
```

This documentation covers all the public APIs, functions, and components in the ironbean ecosystem with comprehensive examples and usage instructions.