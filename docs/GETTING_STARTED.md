# Getting Started with Ironbean

Ironbean is a powerful dependency injection library for TypeScript and JavaScript that provides type-safe dependency management with excellent testing support and React integration.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Your First Component](#your-first-component)
- [Constructor Injection](#constructor-injection)
- [Property Injection](#property-injection)
- [Interface-Based Dependencies](#interface-based-dependencies)
- [Scopes and Lifecycle](#scopes-and-lifecycle)
- [React Integration](#react-integration)
- [Testing](#testing)
- [Advanced Topics](#advanced-topics)

## Installation

### Core Package

Install the core ironbean package:

```bash
npm install --save ironbean
```

### TypeScript Configuration

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### React Integration (Optional)

For React applications:

```bash
npm install --save ironbean-react
```

### React Router Integration (Optional)

For React Router integration:

```bash
npm install --save ironbean-react-router
```

### Testing Support (Optional)

For Jasmine testing support:

```bash
npm install --save-dev ironbean-jasmine
```

## Basic Setup

### 1. Enable Reflection (TypeScript)

Install reflect-metadata if you're using TypeScript:

```bash
npm install --save reflect-metadata
```

Import it at the top of your main entry file:

```typescript
import 'reflect-metadata';
```

### 2. Create Your First Service

```typescript
// services/GreetingService.ts
import { component } from 'ironbean';

@component
export class GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

### 3. Use the Service

```typescript
// main.ts
import 'reflect-metadata';
import { getBaseApplicationContext } from 'ironbean';
import { GreetingService } from './services/GreetingService';

const context = getBaseApplicationContext();
const greetingService = context.getBean(GreetingService);

console.log(greetingService.greet('World')); // Output: Hello, World!
```

## Your First Component

Let's create a simple logging service and use it in another component:

```typescript
// services/LoggerService.ts
import { component } from 'ironbean';

@component
export class LoggerService {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }
  
  error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }
}
```

```typescript
// services/UserService.ts
import { component, autowired } from 'ironbean';
import { LoggerService } from './LoggerService';

@component
export class UserService {
  @autowired
  private logger: LoggerService;
  
  private users: string[] = [];
  
  addUser(name: string): void {
    this.users.push(name);
    this.logger.log(`User ${name} added. Total users: ${this.users.length}`);
  }
  
  getUsers(): string[] {
    this.logger.log(`Retrieved ${this.users.length} users`);
    return [...this.users];
  }
}
```

```typescript
// main.ts
import 'reflect-metadata';
import { getBaseApplicationContext } from 'ironbean';
import { UserService } from './services/UserService';

const context = getBaseApplicationContext();
const userService = context.getBean(UserService);

userService.addUser('Alice');
userService.addUser('Bob');
console.log(userService.getUsers());
```

## Constructor Injection

Constructor injection is often preferred for required dependencies:

```typescript
// services/DatabaseService.ts
import { component } from 'ironbean';

@component
export class DatabaseService {
  connect(): void {
    console.log('Connected to database');
  }
  
  save(data: any): void {
    console.log('Data saved:', data);
  }
}
```

```typescript
// services/ProductService.ts
import { component } from 'ironbean';
import { DatabaseService } from './DatabaseService';
import { LoggerService } from './LoggerService';

@component
export class ProductService {
  constructor(
    private database: DatabaseService,
    private logger: LoggerService
  ) {
    this.database.connect();
    this.logger.log('ProductService initialized');
  }
  
  createProduct(name: string, price: number): void {
    const product = { name, price, id: Math.random() };
    this.database.save(product);
    this.logger.log(`Product created: ${name}`);
  }
}
```

## Property Injection

Property injection is useful for optional dependencies or when you prefer field-based injection:

```typescript
// services/EmailService.ts
import { component, autowired } from 'ironbean';
import { LoggerService } from './LoggerService';

@component
export class EmailService {
  @autowired
  private logger: LoggerService;
  
  sendEmail(to: string, subject: string, body: string): void {
    // Simulate sending email
    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}
```

### Using `inject` Function

As an alternative to the `@autowired` decorator:

```typescript
import { component, inject } from 'ironbean';
import { LoggerService } from './LoggerService';

@component
export class NotificationService {
  private logger = inject(LoggerService);
  
  notify(message: string): void {
    this.logger.log(`Notification: ${message}`);
  }
}
```

### Lazy Injection

For dependencies that should only be created when needed:

```typescript
import { component, inject } from 'ironbean';
import { HeavyService } from './HeavyService';

@component
export class OptimizedService {
  private heavyService = inject.lazy(HeavyService);
  
  performHeavyOperation(): void {
    // HeavyService is only instantiated when first accessed
    this.heavyService.doHeavyWork();
  }
}
```

## Interface-Based Dependencies

For better testability and flexibility, use interfaces:

### 1. Define the Interface and Token

```typescript
// interfaces/IEmailProvider.ts
import { DependencyToken } from 'ironbean';

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export const IEmailProvider = DependencyToken.create<IEmailProvider>('EMAIL_PROVIDER');
```

### 2. Implement the Interface

```typescript
// services/SmtpEmailProvider.ts
import { component } from 'ironbean';
import { IEmailProvider } from '../interfaces/IEmailProvider';

@component
export class SmtpEmailProvider implements IEmailProvider {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`SMTP: Sending email to ${to}`);
    // SMTP implementation here
  }
}
```

### 3. Configure the Binding

```typescript
// config/dependencies.ts
import { take } from 'ironbean';
import { IEmailProvider } from '../interfaces/IEmailProvider';
import { SmtpEmailProvider } from '../services/SmtpEmailProvider';

// Bind the interface to the implementation
take(IEmailProvider).bindTo(SmtpEmailProvider);
```

### 4. Use the Interface

```typescript
// services/UserRegistrationService.ts
import { component, type } from 'ironbean';
import { IEmailProvider } from '../interfaces/IEmailProvider';

@component
export class UserRegistrationService {
  constructor(@type(IEmailProvider) private emailProvider: IEmailProvider) {}
  
  async registerUser(email: string, name: string): Promise<void> {
    // Registration logic...
    
    await this.emailProvider.sendEmail(
      email,
      'Welcome!',
      `Welcome to our service, ${name}!`
    );
  }
}
```

### 5. Complete Setup

```typescript
// main.ts
import 'reflect-metadata';
import './config/dependencies'; // Import configuration
import { getBaseApplicationContext } from 'ironbean';
import { UserRegistrationService } from './services/UserRegistrationService';

const context = getBaseApplicationContext();
const registrationService = context.getBean(UserRegistrationService);

registrationService.registerUser('user@example.com', 'John Doe');
```

## Scopes and Lifecycle

### Component Types

#### Singleton (Default)
One instance per application:

```typescript
import { component, ComponentType } from 'ironbean';

@component // Singleton by default
export class ConfigService {
  private config = { apiUrl: 'https://api.example.com' };
  
  getConfig() {
    return this.config;
  }
}
```

#### Prototype
New instance for each injection:

```typescript
import { component, ComponentType } from 'ironbean';

@component(ComponentType.Prototype)
export class RequestProcessor {
  private requestId = Math.random();
  
  process(data: any) {
    console.log(`Processing with ID: ${this.requestId}`);
  }
}
```

### Custom Scopes

Create custom scopes for managing component lifecycles:

```typescript
// scopes.ts
import { Scope } from 'ironbean';

export const REQUEST_SCOPE = Scope.create('REQUEST');
export const SESSION_SCOPE = Scope.create('SESSION');
```

```typescript
// services/RequestContextService.ts
import { component, scope } from 'ironbean';
import { REQUEST_SCOPE } from '../scopes';

@component
@scope(REQUEST_SCOPE)
export class RequestContextService {
  private startTime = Date.now();
  
  getRequestDuration(): number {
    return Date.now() - this.startTime;
  }
}
```

## React Integration

### Basic Setup

```typescript
// App.tsx
import React from 'react';
import { ContextProvider } from 'ironbean-react';
import { getBaseApplicationContext } from 'ironbean';
import { UserList } from './components/UserList';

const App: React.FC = () => {
  const context = getBaseApplicationContext();
  
  return (
    <ContextProvider context={context}>
      <div className="App">
        <h1>My Application</h1>
        <UserList />
      </div>
    </ContextProvider>
  );
};

export default App;
```

### Using Services in Components

```typescript
// components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { useBean } from 'ironbean-react';
import { UserService } from '../services/UserService';

export const UserList: React.FC = () => {
  const userService = useBean(UserService);
  const [users, setUsers] = useState<string[]>([]);
  
  useEffect(() => {
    setUsers(userService.getUsers());
  }, [userService]);
  
  const handleAddUser = () => {
    const name = prompt('Enter user name:');
    if (name) {
      userService.addUser(name);
      setUsers(userService.getUsers());
    }
  };
  
  return (
    <div>
      <h2>Users</h2>
      <button onClick={handleAddUser}>Add User</button>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Class Components

For class components, use the `@withContext()` decorator:

```typescript
// components/UserProfile.tsx
import React from 'react';
import { withContext } from 'ironbean-react';
import { autowired } from 'ironbean';
import { UserService } from '../services/UserService';

interface Props {
  userId: string;
}

@withContext()
export class UserProfile extends React.Component<Props> {
  @autowired
  private userService: UserService;
  
  render() {
    return (
      <div>
        <h3>User Profile</h3>
        {/* Component content */}
      </div>
    );
  }
}
```

## Testing

### Basic Testing Setup

```typescript
// tests/UserService.test.ts
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
import { UserService } from '../services/UserService';
import { LoggerService } from '../services/LoggerService';

describe('UserService', () => {
  let context: JasmineTestingContext;
  let userService: UserService;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    userService = context.getBean(UserService);
    mockLogger = context.getMock(LoggerService);
  });
  
  it('should add user and log the action', () => {
    const userName = 'TestUser';
    
    userService.addUser(userName);
    
    expect(mockLogger.log).toHaveBeenCalledWith(
      'User TestUser added. Total users: 1'
    );
  });
  
  it('should return all users', () => {
    userService.addUser('User1');
    userService.addUser('User2');
    
    const users = userService.getUsers();
    
    expect(users).toEqual(['User1', 'User2']);
    expect(mockLogger.log).toHaveBeenCalledWith('Retrieved 2 users');
  });
});
```

### Testing with Interface Dependencies

```typescript
// tests/UserRegistrationService.test.ts
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
import { UserRegistrationService } from '../services/UserRegistrationService';
import { IEmailProvider } from '../interfaces/IEmailProvider';

describe('UserRegistrationService', () => {
  let context: JasmineTestingContext;
  let registrationService: UserRegistrationService;
  let mockEmailProvider: jasmine.SpyObj<IEmailProvider>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    registrationService = context.getBean(UserRegistrationService);
    mockEmailProvider = context.getMock(IEmailProvider);
  });
  
  it('should send welcome email after registration', async () => {
    const email = 'test@example.com';
    const name = 'Test User';
    
    mockEmailProvider.sendEmail.and.returnValue(Promise.resolve());
    
    await registrationService.registerUser(email, name);
    
    expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
      email,
      'Welcome!',
      `Welcome to our service, ${name}!`
    );
  });
});
```

## Advanced Topics

### Factory Functions

Use factories for complex object creation:

```typescript
// config/factories.ts
import { take, ComponentContext } from 'ironbean';
import { IEmailProvider } from '../interfaces/IEmailProvider';
import { SmtpEmailProvider } from '../services/SmtpEmailProvider';
import { MockEmailProvider } from '../services/MockEmailProvider';

take(IEmailProvider).setFactory((context: ComponentContext) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return new MockEmailProvider();
  } else {
    const config = context.getBean(ConfigService);
    return new SmtpEmailProvider(config.getSmtpSettings());
  }
});
```

### Post-Construction Initialization

Use `@postConstruct` for initialization after dependency injection:

```typescript
import { component, autowired, postConstruct } from 'ironbean';

@component
export class DatabaseConnectionService {
  @autowired
  private configService: ConfigService;
  
  private connection: any;
  
  @postConstruct
  async initialize(): Promise<void> {
    const config = this.configService.getDatabaseConfig();
    this.connection = await createConnection(config);
  }
  
  query(sql: string): any {
    return this.connection.query(sql);
  }
}
```

### Conditional Dependencies

Use factories for conditional dependency resolution:

```typescript
// config/conditionalDependencies.ts
import { take } from 'ironbean';
import { IPaymentProcessor } from '../interfaces/IPaymentProcessor';

take(IPaymentProcessor).setFactory((context) => {
  const config = context.getBean(ConfigService);
  const provider = config.getPaymentProvider();
  
  switch (provider) {
    case 'stripe':
      return context.getBean(StripePaymentProcessor);
    case 'paypal':
      return context.getBean(PayPalPaymentProcessor);
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
});
```

### Multiple Implementations

Handle multiple implementations of the same interface:

```typescript
// services/NotificationService.ts
import { component, inject, type } from 'ironbean';
import { INotificationProvider } from '../interfaces/INotificationProvider';

@component
export class NotificationService {
  constructor(
    @type(EmailNotificationProvider) private emailProvider: INotificationProvider,
    @type(SmsNotificationProvider) private smsProvider: INotificationProvider
  ) {}
  
  async sendNotification(message: string, channel: 'email' | 'sms'): Promise<void> {
    const provider = channel === 'email' ? this.emailProvider : this.smsProvider;
    await provider.send(message);
  }
}
```

This getting started guide provides a comprehensive foundation for using Ironbean in your TypeScript/JavaScript projects. Each section builds upon the previous one, allowing you to gradually adopt more advanced features as your application grows in complexity.