# Ironbean Examples

This document contains comprehensive real-world examples demonstrating how to use Ironbean in various scenarios.

## Table of Contents

- [Basic Web API Service](#basic-web-api-service)
- [React Application with State Management](#react-application-with-state-management)
- [E-commerce Application](#e-commerce-application)
- [Testing Strategies](#testing-strategies)
- [React Router with Scoped Services](#react-router-with-scoped-services)
- [Microservices Architecture](#microservices-architecture)
- [Event-Driven Architecture](#event-driven-architecture)

## Basic Web API Service

A complete example of a REST API service using Express.js and Ironbean.

### Project Structure
```
src/
├── controllers/
│   ├── UserController.ts
│   └── ProductController.ts
├── services/
│   ├── UserService.ts
│   ├── ProductService.ts
│   └── DatabaseService.ts
├── interfaces/
│   ├── ILogger.ts
│   ├── IUserRepository.ts
│   └── IProductRepository.ts
├── repositories/
│   ├── UserRepository.ts
│   └── ProductRepository.ts
├── config/
│   └── dependencies.ts
└── main.ts
```

### Interfaces

```typescript
// interfaces/ILogger.ts
import { DependencyToken } from 'ironbean';

export interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error): void;
  warn(message: string, meta?: any): void;
}

export const ILogger = DependencyToken.create<ILogger>('LOGGER');
```

```typescript
// interfaces/IUserRepository.ts
import { DependencyToken } from 'ironbean';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

export const IUserRepository = DependencyToken.create<IUserRepository>('USER_REPOSITORY');
```

### Services

```typescript
// services/DatabaseService.ts
import { component, postConstruct } from 'ironbean';

@component
export class DatabaseService {
  private connection: any;
  
  @postConstruct
  async initialize(): Promise<void> {
    // Initialize database connection
    this.connection = await this.createConnection();
  }
  
  private async createConnection(): Promise<any> {
    // Database connection logic
    console.log('Database connected');
    return {};
  }
  
  getConnection() {
    return this.connection;
  }
}
```

```typescript
// services/UserService.ts
import { component, type, autowired } from 'ironbean';
import { IUserRepository, User } from '../interfaces/IUserRepository';
import { ILogger } from '../interfaces/ILogger';

@component
export class UserService {
  constructor(
    @type(IUserRepository) private userRepository: IUserRepository,
    @type(ILogger) private logger: ILogger
  ) {}
  
  async createUser(userData: { name: string; email: string }): Promise<User> {
    this.logger.info('Creating new user', { email: userData.email });
    
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const user = await this.userRepository.create(userData);
    this.logger.info('User created successfully', { userId: user.id });
    
    return user;
  }
  
  async getUserById(id: string): Promise<User> {
    this.logger.info('Fetching user by ID', { userId: id });
    
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    this.logger.info('Updating user', { userId: id, updates });
    
    const user = await this.userRepository.update(id, updates);
    this.logger.info('User updated successfully', { userId: id });
    
    return user;
  }
}
```

### Repositories

```typescript
// repositories/UserRepository.ts
import { component, autowired } from 'ironbean';
import { IUserRepository, User } from '../interfaces/IUserRepository';
import { DatabaseService } from '../services/DatabaseService';

@component
export class UserRepository implements IUserRepository {
  @autowired
  private database: DatabaseService;
  
  async findById(id: string): Promise<User | null> {
    // Implementation using database service
    console.log(`Finding user by ID: ${id}`);
    return null; // Mock implementation
  }
  
  async findByEmail(email: string): Promise<User | null> {
    console.log(`Finding user by email: ${email}`);
    return null; // Mock implementation
  }
  
  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: Math.random().toString(36),
      createdAt: new Date()
    };
    
    console.log('Creating user in database', user);
    return user;
  }
  
  async update(id: string, userData: Partial<User>): Promise<User> {
    console.log(`Updating user ${id}`, userData);
    // Mock implementation
    return {
      id,
      name: userData.name || 'Updated User',
      email: userData.email || 'updated@example.com',
      createdAt: new Date()
    };
  }
  
  async delete(id: string): Promise<void> {
    console.log(`Deleting user: ${id}`);
  }
}
```

### Controllers

```typescript
// controllers/UserController.ts
import { component, autowired } from 'ironbean';
import { UserService } from '../services/UserService';
import { Request, Response } from 'express';

@component
export class UserController {
  @autowired
  private userService: UserService;
  
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
  
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### Configuration

```typescript
// config/dependencies.ts
import { take } from 'ironbean';
import { ILogger } from '../interfaces/ILogger';
import { IUserRepository } from '../interfaces/IUserRepository';
import { UserRepository } from '../repositories/UserRepository';

// Simple console logger implementation
class ConsoleLogger implements ILogger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta || '');
  }
  
  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
  
  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }
}

// Configure dependencies
take(ILogger).setFactory(() => new ConsoleLogger());
take(IUserRepository).bindTo(UserRepository);
```

### Main Application

```typescript
// main.ts
import 'reflect-metadata';
import express from 'express';
import './config/dependencies';
import { getBaseApplicationContext } from 'ironbean';
import { UserController } from './controllers/UserController';

const app = express();
app.use(express.json());

const context = getBaseApplicationContext();
const userController = context.getBean(UserController);

// Routes
app.post('/users', (req, res) => userController.createUser(req, res));
app.get('/users/:id', (req, res) => userController.getUser(req, res));
app.put('/users/:id', (req, res) => userController.updateUser(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## React Application with State Management

A complete React application using Ironbean for dependency injection and MobX for state management.

### Project Structure
```
src/
├── stores/
│   ├── UserStore.ts
│   ├── ProductStore.ts
│   └── AppStore.ts
├── services/
│   ├── ApiService.ts
│   ├── UserService.ts
│   └── ProductService.ts
├── components/
│   ├── UserList.tsx
│   ├── UserForm.tsx
│   └── ProductCatalog.tsx
├── hooks/
│   └── useStores.ts
├── config/
│   └── dependencies.ts
└── App.tsx
```

### Stores

```typescript
// stores/UserStore.ts
import { makeAutoObservable } from 'mobx';
import { component, autowired } from 'ironbean';
import { UserService } from '../services/UserService';

export interface User {
  id: string;
  name: string;
  email: string;
}

@component
export class UserStore {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  
  @autowired
  private userService: UserService;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  async loadUsers(): Promise<void> {
    this.loading = true;
    this.error = null;
    
    try {
      this.users = await this.userService.getAllUsers();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
  
  async addUser(userData: Omit<User, 'id'>): Promise<void> {
    try {
      const newUser = await this.userService.createUser(userData);
      this.users.push(newUser);
    } catch (error) {
      this.error = error.message;
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      const updatedUser = await this.userService.updateUser(id, updates);
      const index = this.users.findIndex(u => u.id === id);
      if (index !== -1) {
        this.users[index] = updatedUser;
      }
    } catch (error) {
      this.error = error.message;
    }
  }
  
  async deleteUser(id: string): Promise<void> {
    try {
      await this.userService.deleteUser(id);
      this.users = this.users.filter(u => u.id !== id);
    } catch (error) {
      this.error = error.message;
    }
  }
}
```

### Services

```typescript
// services/ApiService.ts
import { component } from 'ironbean';

@component
export class ApiService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
```

```typescript
// services/UserService.ts
import { component, autowired } from 'ironbean';
import { ApiService } from './ApiService';

export interface User {
  id: string;
  name: string;
  email: string;
}

@component
export class UserService {
  @autowired
  private api: ApiService;
  
  async getAllUsers(): Promise<User[]> {
    return this.api.get<User[]>('/users');
  }
  
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.api.post<User>('/users', userData);
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.api.put<User>(`/users/${id}`, updates);
  }
  
  async deleteUser(id: string): Promise<void> {
    return this.api.delete(`/users/${id}`);
  }
}
```

### Components

```typescript
// components/UserList.tsx
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useBean } from 'ironbean-react';
import { UserStore } from '../stores/UserStore';

export const UserList: React.FC = observer(() => {
  const userStore = useBean(UserStore);
  
  useEffect(() => {
    userStore.loadUsers();
  }, [userStore]);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await userStore.deleteUser(id);
    }
  };
  
  if (userStore.loading) {
    return <div>Loading users...</div>;
  }
  
  if (userStore.error) {
    return <div className="error">Error: {userStore.error}</div>;
  }
  
  return (
    <div className="user-list">
      <h2>Users</h2>
      {userStore.users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userStore.users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});
```

```typescript
// components/UserForm.tsx
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBean } from 'ironbean-react';
import { UserStore } from '../stores/UserStore';

export const UserForm: React.FC = observer(() => {
  const userStore = useBean(UserStore);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await userStore.addUser(formData);
    setFormData({ name: '', email: '' });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="user-form">
      <h3>Add New User</h3>
      
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <button type="submit">Add User</button>
      
      {userStore.error && (
        <div className="error">{userStore.error}</div>
      )}
    </form>
  );
});
```

### Main App

```typescript
// App.tsx
import React from 'react';
import { ContextProvider } from 'ironbean-react';
import { getBaseApplicationContext } from 'ironbean';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import './config/dependencies';

const App: React.FC = () => {
  const context = getBaseApplicationContext();
  
  return (
    <ContextProvider context={context}>
      <div className="App">
        <header>
          <h1>User Management System</h1>
        </header>
        <main>
          <div className="container">
            <div className="form-section">
              <UserForm />
            </div>
            <div className="list-section">
              <UserList />
            </div>
          </div>
        </main>
      </div>
    </ContextProvider>
  );
};

export default App;
```

## E-commerce Application

A comprehensive e-commerce application demonstrating advanced patterns.

### Domain Models and Services

```typescript
// models/Product.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: number;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
}
```

```typescript
// interfaces/IPaymentService.ts
import { DependencyToken } from 'ironbean';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface IPaymentService {
  processPayment(amount: number, paymentMethod: string): Promise<PaymentResult>;
}

export const IPaymentService = DependencyToken.create<IPaymentService>('PAYMENT_SERVICE');
```

```typescript
// services/OrderService.ts
import { component, autowired, type } from 'ironbean';
import { CartItem, Order } from '../models/Product';
import { IPaymentService } from '../interfaces/IPaymentService';
import { InventoryService } from './InventoryService';

@component
export class OrderService {
  @autowired
  private inventoryService: InventoryService;
  
  constructor(@type(IPaymentService) private paymentService: IPaymentService) {}
  
  async createOrder(userId: string, items: CartItem[]): Promise<Order> {
    // Validate inventory
    for (const item of items) {
      const available = await this.inventoryService.checkStock(item.product.id);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name}`);
      }
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );
    
    // Process payment
    const paymentResult = await this.paymentService.processPayment(total, 'credit_card');
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }
    
    // Reserve inventory
    for (const item of items) {
      await this.inventoryService.reserveStock(item.product.id, item.quantity);
    }
    
    // Create order
    const order: Order = {
      id: Math.random().toString(36),
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date()
    };
    
    return order;
  }
  
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    // Implementation for updating order status
    console.log(`Order ${orderId} status updated to ${status}`);
  }
}
```

### Payment Service Implementations

```typescript
// services/StripePaymentService.ts
import { component } from 'ironbean';
import { IPaymentService, PaymentResult } from '../interfaces/IPaymentService';

@component
export class StripePaymentService implements IPaymentService {
  async processPayment(amount: number, paymentMethod: string): Promise<PaymentResult> {
    try {
      // Stripe payment processing logic
      console.log(`Processing $${amount} payment via Stripe`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        transactionId: `stripe_${Math.random().toString(36)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

```typescript
// services/PayPalPaymentService.ts
import { component } from 'ironbean';
import { IPaymentService, PaymentResult } from '../interfaces/IPaymentService';

@component
export class PayPalPaymentService implements IPaymentService {
  async processPayment(amount: number, paymentMethod: string): Promise<PaymentResult> {
    try {
      console.log(`Processing $${amount} payment via PayPal`);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        transactionId: `paypal_${Math.random().toString(36)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### Configuration with Factory

```typescript
// config/paymentConfig.ts
import { take } from 'ironbean';
import { IPaymentService } from '../interfaces/IPaymentService';
import { StripePaymentService } from '../services/StripePaymentService';
import { PayPalPaymentService } from '../services/PayPalPaymentService';

// Environment-based payment service selection
take(IPaymentService).setFactory((context) => {
  const paymentProvider = process.env.REACT_APP_PAYMENT_PROVIDER || 'stripe';
  
  switch (paymentProvider) {
    case 'stripe':
      return context.getBean(StripePaymentService);
    case 'paypal':
      return context.getBean(PayPalPaymentService);
    default:
      throw new Error(`Unknown payment provider: ${paymentProvider}`);
  }
});
```

## Testing Strategies

Comprehensive testing examples using Ironbean's testing utilities.

### Service Testing

```typescript
// tests/OrderService.test.ts
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
import { OrderService } from '../services/OrderService';
import { InventoryService } from '../services/InventoryService';
import { IPaymentService } from '../interfaces/IPaymentService';
import { CartItem, Product } from '../models/Product';

describe('OrderService', () => {
  let context: JasmineTestingContext;
  let orderService: OrderService;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockPaymentService: jasmine.SpyObj<IPaymentService>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    orderService = context.getBean(OrderService);
    mockInventoryService = context.getMock(InventoryService);
    mockPaymentService = context.getMock(IPaymentService);
  });
  
  describe('createOrder', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'test',
      inStock: 10
    };
    
    const mockCartItem: CartItem = {
      product: mockProduct,
      quantity: 2
    };
    
    it('should create order successfully', async () => {
      // Arrange
      mockInventoryService.checkStock.and.returnValue(Promise.resolve(10));
      mockInventoryService.reserveStock.and.returnValue(Promise.resolve());
      mockPaymentService.processPayment.and.returnValue(Promise.resolve({
        success: true,
        transactionId: 'test_123'
      }));
      
      // Act
      const order = await orderService.createOrder('user1', [mockCartItem]);
      
      // Assert
      expect(order).toBeDefined();
      expect(order.userId).toBe('user1');
      expect(order.items).toEqual([mockCartItem]);
      expect(order.total).toBe(200); // 100 * 2
      expect(order.status).toBe('pending');
      
      expect(mockInventoryService.checkStock).toHaveBeenCalledWith('1');
      expect(mockInventoryService.reserveStock).toHaveBeenCalledWith('1', 2);
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(200, 'credit_card');
    });
    
    it('should throw error when insufficient stock', async () => {
      // Arrange
      mockInventoryService.checkStock.and.returnValue(Promise.resolve(1)); // Less than required
      
      // Act & Assert
      await expectAsync(
        orderService.createOrder('user1', [mockCartItem])
      ).toBeRejectedWithError('Insufficient stock for Test Product');
      
      expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
      expect(mockInventoryService.reserveStock).not.toHaveBeenCalled();
    });
    
    it('should throw error when payment fails', async () => {
      // Arrange
      mockInventoryService.checkStock.and.returnValue(Promise.resolve(10));
      mockPaymentService.processPayment.and.returnValue(Promise.resolve({
        success: false,
        error: 'Card declined'
      }));
      
      // Act & Assert
      await expectAsync(
        orderService.createOrder('user1', [mockCartItem])
      ).toBeRejectedWithError('Payment failed: Card declined');
      
      expect(mockInventoryService.reserveStock).not.toHaveBeenCalled();
    });
  });
});
```

### React Component Testing

```typescript
// tests/UserList.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextProvider } from 'ironbean-react';
import { getBaseJasmineTestingContext } from 'ironbean-jasmine';
import { UserList } from '../components/UserList';
import { UserStore } from '../stores/UserStore';
import { UserService } from '../services/UserService';

describe('UserList Component', () => {
  let context: JasmineTestingContext;
  let mockUserService: jasmine.SpyObj<UserService>;
  
  beforeEach(() => {
    context = getBaseJasmineTestingContext();
    mockUserService = context.getMock(UserService);
  });
  
  const renderComponent = () => {
    return render(
      <ContextProvider context={context}>
        <UserList />
      </ContextProvider>
    );
  };
  
  it('should display users when loaded', async () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    mockUserService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
    
    // Act
    renderComponent();
    
    // Assert
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
  
  it('should handle delete user', async () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ];
    
    mockUserService.getAllUsers.and.returnValue(Promise.resolve(mockUsers));
    mockUserService.deleteUser.and.returnValue(Promise.resolve());
    
    window.confirm = jasmine.createSpy().and.returnValue(true);
    
    // Act
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    // Assert
    await waitFor(() => {
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
```

## React Router with Scoped Services

Advanced example using React Router with scoped dependency injection.

```typescript
// scopes.ts
import { Scope } from 'ironbean';

export const PAGE_SCOPE = Scope.create('PAGE');
export const USER_SCOPE = Scope.create('USER');
export const ADMIN_SCOPE = Scope.create('ADMIN');
```

```typescript
// services/PageContextService.ts
import { component, scope, autowired } from 'ironbean';
import { PAGE_SCOPE } from '../scopes';

@component
@scope(PAGE_SCOPE)
export class PageContextService {
  private pageData: Record<string, any> = {};
  private startTime = Date.now();
  
  setPageData(key: string, value: any): void {
    this.pageData[key] = value;
  }
  
  getPageData(key: string): any {
    return this.pageData[key];
  }
  
  getPageLoadTime(): number {
    return Date.now() - this.startTime;
  }
}
```

```typescript
// App.tsx with Router Integration
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ContextProvider } from 'ironbean-react';
import { IronRouter, RouterResolver } from 'ironbean-react-router';
import { getBaseApplicationContext } from 'ironbean';
import { PAGE_SCOPE, USER_SCOPE, ADMIN_SCOPE } from './scopes';

const App: React.FC = () => {
  const context = getBaseApplicationContext();
  
  const resolver = RouterResolver.create([
    { scope: PAGE_SCOPE, path: /.+/ }, // All pages get page scope
    { scope: USER_SCOPE, path: /^\/user/ },
    { scope: ADMIN_SCOPE, path: /^\/admin/ }
  ]);
  
  return (
    <BrowserRouter>
      <ContextProvider context={context}>
        <IronRouter resolver={resolver}>
          <Routes>
            <Route path="/user/*" element={<UserSection />} />
            <Route path="/admin/*" element={<AdminSection />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </IronRouter>
      </ContextProvider>
    </BrowserRouter>
  );
};
```

This comprehensive examples document demonstrates real-world usage patterns and best practices for using Ironbean in various application architectures.