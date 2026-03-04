import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean

A dependency injection container for TypeScript and JavaScript, built with emphasis on type safety, testability and clean API.

## Installation

\`\`\`sh
npm install --save ironbean
\`\`\`

Modify your \`tsconfig.json\`:

\`\`\`json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
\`\`\`

## Class component

Mark a class with \`@component\` to register it with ironbean. By default components are **singletons** — ironbean creates one instance and reuses it everywhere.

\`\`\`typescript
import { component } from "ironbean";

@component
class Engine {
    start() { /* ... */ }
}

@component
class Car {
    constructor(private engine: Engine) {}
}
\`\`\`

### Component types

Pass \`ComponentType\` directly to the decorator to change the lifecycle:

\`\`\`typescript
import { component, ComponentType } from "ironbean";

@component(ComponentType.Prototype)
class Request {
    // a new instance is created for every injection point
}
\`\`\`

| Type | Behavior |
|---|---|
| \`Singleton\` | One instance per context (default) |
| \`Prototype\` | New instance for every \`getBean\` / injection |

## Dependency token

Use \`DependencyToken\` to identify dependencies that have no class representation — typically interfaces or primitive values.

\`\`\`typescript
import { DependencyToken, take } from "ironbean";

interface IStorage {
    save(data: string): void;
}

const IStorage = DependencyToken.create<IStorage>("IStorage");

// bind to a class
take(IStorage).bindTo(DbStorage);

// or provide a factory
take(IStorage).setFactory(() => new DbStorage());
\`\`\`

Use \`@type\` to inject by token in constructor or property:

\`\`\`typescript
import { component, type, autowired } from "ironbean";

@component
class App {
    // constructor injection
    constructor(@type(IStorage) private storage: IStorage) {}
}

@component
class App2 {
    // property injection
    @type(IStorage)
    @autowired
    private storage: IStorage;
}
\`\`\`

### Class-based tokens

For primitive types you can create typed token classes by extending the built-in token base classes. This allows using \`@autowired\` without \`@type\`:

\`\`\`typescript
class ApiUrl extends DependencyToken.String {}
class MaxRetries extends DependencyToken.Number {}
class FeatureFlags extends DependencyToken.Array<string> {}

take(ApiUrl).setFactory(() => "https://api.example.com");
take(MaxRetries).setFactory(() => 3);

@component
class ApiClient {
    @autowired apiUrl: ApiUrl;         // resolves to string
    @autowired maxRetries: MaxRetries; // resolves to number
}
\`\`\`

Available base classes: \`DependencyToken.String\`, \`DependencyToken.Number\`, \`DependencyToken.Boolean\`, \`DependencyToken.Array<T>\`, \`DependencyToken.Map<K, V>\`, \`DependencyToken.Set<T>\`.

### Forward references

To avoid circular import issues or when the class isn't available at decoration time, pass a factory function to \`@type\`:

\`\`\`typescript
@component
class A {
    constructor(@type(() => B) private b: B) {}
}
\`\`\`

## ApplicationContext

The root container from which you resolve dependencies.

\`\`\`typescript
import { getBaseApplicationContext, destroyContext } from "ironbean";

const context = getBaseApplicationContext();
const app = context.getBean(Application);
app.run();

// tear down — destroys all singletons (useful in tests)
destroyContext();
\`\`\`

Use \`createBaseApplicationContext()\` when you need multiple independent containers in the same process (e.g. server-side rendering with isolated contexts per request). These two functions are mutually exclusive in the same environment.

\`\`\`typescript
import { createBaseApplicationContext } from "ironbean";

const ctx1 = createBaseApplicationContext();
const ctx2 = createBaseApplicationContext(); // independent context
\`\`\`

## Injection types

### Constructor injection

Ironbean resolves constructor parameters by their TypeScript types automatically (requires \`emitDecoratorMetadata\`).

\`\`\`typescript
@component
class OrderService {
    constructor(
        private db: Database,
        private mailer: Mailer,
    ) {}
}
\`\`\`

### Property injection

Use \`@autowired\` on a property. Works both inside \`@component\` classes and in plain classes.

\`\`\`typescript
@component
class OrderService {
    @autowired private db: Database;
    @autowired private mailer: Mailer;
}
\`\`\`

### Method injection

\`@postConstruct\` is called once after the component is fully constructed. Dependencies are injected as arguments.

\`\`\`typescript
@component
class OrderService {
    private db: Database;

    @postConstruct
    init(db: Database) {
        this.db = db;
    }
}
\`\`\`

### inject() function

Use \`inject()\` inside a constructor body to resolve a dependency without decorators. \`inject.lazy()\` creates a lazy proxy — the real instance is resolved on first property access.

\`\`\`typescript
import { inject } from "ironbean";

@component
class OrderService {
    private db = inject(Database);
    private mailer = inject.lazy(Mailer); // resolved on first use
}
\`\`\`

## Lazy injection

Lazy injection defers the resolution of a dependency until it's first accessed. Useful for breaking circular dependencies or improving startup time.

\`\`\`typescript
import { component, autowired, lazy } from "ironbean";

@component
class A {
    @lazy
    @autowired
    private b: B; // B is resolved only when a.b is accessed
}
\`\`\`

In constructor injection, use the \`@lazy\` parameter decorator:

\`\`\`typescript
@component
class A {
    constructor(@lazy private b: B) {}
}
\`\`\`

For programmatic lazy injection:

\`\`\`typescript
import { inject } from "ironbean";
import { LazyToken } from "ironbean";

@component
class A {
    private b = inject(LazyToken.create(B));
    // equivalent to:
    private b2 = inject.lazy(B);
}
\`\`\`

## Collection injection

When multiple classes are bound to the same token, inject all of them as an array using \`@collection\`.

\`\`\`typescript
import { component, take, autowired, collection, type } from "ironbean";

abstract class Plugin {}

@component
class PluginA extends Plugin {}

@component
class PluginB extends Plugin {}

take(Plugin).bindTo(PluginA);
take(Plugin).bindTo(PluginB);

@component
class PluginHost {
    @collection
    @type(() => Plugin)
    @autowired
    plugins: Plugin[]; // [PluginA instance, PluginB instance]
}
\`\`\`

Works in constructor injection too:

\`\`\`typescript
@component
class PluginHost {
    constructor(
        @collection @type(() => Plugin) plugins: Plugin[]
    ) {}
}
\`\`\`

Combine with \`@lazy\` to defer instantiation of all plugins until first access:

\`\`\`typescript
@collection @lazy @type(() => Plugin) @autowired plugins: Plugin[];
\`\`\`

## Scopes

Scopes let you group components that share a lifecycle — for example a request scope or a session scope.

\`\`\`typescript
import { Scope, scope, component, autowired, ApplicationContext } from "ironbean";

const RequestScope = Scope.create("request");

@component
@scope(RequestScope)
class RequestContext {
    id = Math.random();
}

@component
@scope(RequestScope)
class RequestHandler {
    @autowired context: RequestContext;
    @autowired appContext: ApplicationContext; // the scoped context, not the root one

    handle() {
        console.log(this.context.id);
    }
}
\`\`\`

Create a child context for the scope and resolve from it:

\`\`\`typescript
const appCtx = getBaseApplicationContext();

// each call creates a new independent scope context
const reqCtx = appCtx.createOrGetParentContext(RequestScope);
const handler = reqCtx.getBean(RequestHandler);
\`\`\`

### Nested scopes

Scopes can be nested — a child scope has access to all beans from parent scopes:

\`\`\`typescript
const SessionScope = Scope.create("session");
const RequestScope = SessionScope.createScope("request");
\`\`\`

### @needScope / @provideScope

For plain (non-component) classes that must be instantiated inside a specific scope context, use \`@needScope\`. Use \`@provideScope\` on the method that creates them so ironbean can wire their \`@autowired\` properties:

\`\`\`typescript
import { needScope, provideScope, component, scope, autowired } from "ironbean";

@needScope(RequestScope)
class RequestModel {
    @autowired context: ApplicationContext; // receives the scope's context
}

@component
@scope(RequestScope)
class RequestFactory {
    @autowired context: ApplicationContext;

    @provideScope
    create(): RequestModel {
        return new RequestModel();
    }
}
\`\`\`

## Factory classes

Instead of a function, you can provide an \`IFactory\` class as the factory. The factory class itself is resolved from the container, so it can have dependencies:

\`\`\`typescript
import { component, IFactory, take, DependencyToken } from "ironbean";

const IConnection = DependencyToken.create<Connection>("IConnection");

@component
class ConnectionFactory implements IFactory<Connection> {
    constructor(private config: Config) {}

    create(): Connection {
        return new Connection(this.config.url);
    }
}

take(IConnection).setFactory(ConnectionFactory);
\`\`\`

The \`create()\` method also supports parameter injection:

\`\`\`typescript
@component
class ConnectionFactory implements IFactory<Connection> {
    create(config: Config, logger: Logger): Connection {
        return new Connection(config.url, logger);
    }
}
\`\`\`

## Configuration

All configuration is done via the \`take()\` function:

\`\`\`typescript
import { take, ComponentType } from "ironbean";

// Bind a token to a class implementation
take(IStorage).bindTo(DbStorage);

// Bind multiple implementations (used with @collection)
take(Plugin).bindTo(PluginA);
take(Plugin).bindTo(PluginB);

// Provide a factory function
take(IStorage).setFactory((ctx) => new DbStorage(ctx.getBean(Config)));

// Provide a factory class
take(IStorage).setFactory(StorageFactory);

// Set component type
take(SomeService).setType(ComponentType.Prototype);

// Override mock class type (affects TestingContext automocking)
take(SomeService).setClassType(SomeConcreteClass);
\`\`\`

## Changelog

### 1.0.22
- Class token automocking by classType

### 1.0.21
- Fixes for ES6 environment

### 1.0.20
- Upgrade TypeScript to 4.9

### 1.0.19
- \`inject(type)\` function
- \`inject.lazy(type)\` function

### 1.0.16
- Support for abstract classes

### 1.0.15
- \`createBaseApplicationContext\`

### 1.0.13
- Support parameter decorator for constructor

### 1.0.12
- Testing: enable automock for class component with \`enableMock()\`

### 1.0.11
- Fixed lazy component \`@postConstruct\` useless call
- Fixed \`@type\` decorator for builds without \`emitDecoratorMetadata\`

### 1.0.8
- Dependency tokens via class extend (\`DependencyToken.Number\`, etc.)
- \`take().setClassType()\` for automocking in testing

### 1.0.7
- \`Scope.getDefault()\`
- \`Scope.isParent(scope)\`

### 1.0.6
- API: \`registerPlugin\`, \`createComponentContext\`
- \`take().clear()\`

### 1.0.5
- Collection components (\`@collection\`)
- Lazy collection injection
- Scope improvements

### 1.0.4
- \`setMockFactory\` without \`@component\`
- Unknown dependency mock via \`Proxy\`

### 1.0.3
- \`@lazy\` for \`@autowired\`
- \`createOrGetParentContext\` on context

### 1.0.2
- Fix \`@type\` decorator
- Constructor \`@lazy\` support
- Circular dependency detection
- \`@type\` allows dependency token in callback

### 1.0.1
- Component performance improvements
- Scopes refactor
`;

export default function IronbeanPage() {
  return <MarkdownContent content={content} />;
}
