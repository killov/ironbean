# ironbean

Ironbean is dependency injection library for Typescript or Javascript. 
The reason of creation: I needed DIC for a typescript, but I wasn't satisfied with any other libraries. 
Most of them are outdated, and they lack type safety and test environment.

During development, I emphasized on:
- understandable and easy to use API
- option of test environment
- type safety support for typescript
- annotation support

## Installation

Install by `npm`

```sh
npm install --save ironbean
```
Modify your `tsconfig.json` to include the following settings

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
## Documentation

- [Class component](#class-component)
- [Dependency token](#dependency-token)
- [Async components](#async-components)

### Class component

Components are definitions for ironbean which instantiate.

```typescript
@component
class DbTodoStorage {
    private db: Db;
    constructor(db: Db) {
        this.db = db;
    }

    saveTodo(todo: Todo): void {
        //...
    }
}
```

### Dependency token
Identifies dependencies which are not identifiable by class. For example interfaces.

```typescript
import {DependencyToken} from "ironbean";

const ITodoStorage = DependencyToken.create<ITodoStorage>("TODO_STORAGE");
```

Use annotation ```@type``` for dependency identification.

```typescript
import {component, type} from "ironbean";

@component
class TodoList {
    private storage: ITodoStorage;
    constructor(@type(ITodoStorage) storage: ITodoStorage) {
        this.storage = storage;
    }
}
```

There are two ways how ironbean can create instances for dependency tokens:
- Bind token to class component.
   ```typescript
  import {take} from "ironbean";
   
   // for ITodoStorage use DbTodoStorage
   take(ITodoStorage).bindTo(DbTodoStorage);
   ```
  ironbean creates an instance of class component.

- Set factory for dependency token
  ```typescript
  import {take, ComponentContext} from "ironbean";
  
  take(ITodoStorage).setFactory((context: ComponentContext): ITodoStorage => {
       // factory for create instance
       return createTodoStorage();
  });
  ```

### ApplicationContext
ApplicationContext is used for getting dependencies from current scope.

#### Getting ApplicationContext

Behaviour of ApplicationContext is the same as behaviour of the component.
We can get the instance of ApplicationContext by using any type of injection.

If we need to get instance of ApplicationContext in global environment,
for example for starting an application, we use function getBaseApplicationContext().

 ```typescript
import {getBaseApplicationContext} from "ironbean";

const context = getBaseApplicationContext();

const app = context.getBean(Application);
app.run();
  ```

#### Methods description
- ```public getBean<T>(dependency: Dependency<T>): T```
    - is used for getting dependencies
    - we need dependency token

### ComponentContext
ComponentContext is used for getting dependencies intro component.
Behaviour is almost the same as ApplicationContext, the difference is that component with type prototype
memorizes instances that were created in previous request of the same dependency token.
All types of injection inside the components used in background ComponentContext.

### Inject types in class components
#### Constructor injection
Intuitive instance getting by constructor, if you use typescript with reflection you only need to specify type of class, 
if not, use decorator ```@type```.
 ```typescript
import {component} from "ironbean";

@component
class Enginge {
    
}

@component
class Car {
    private readonly enginge: Enginge;

    constructor(enginge: Enginge) {
        this.enginge = enginge;
    }
}
```

#### Property injection
To inject the instance to property use decorator ```@autowired```, if you use reflection, use ```@type```.

 ```typescript
import {component, autowired} from "ironbean";

@component
class Enginge {

}

@component
class Car {
    @autowired
    private readonly enginge: Enginge;
}
```

Can use ```inject``` function instead of decorator ```@autowired```.

```typescript
import {inject} from "ironbean";

@component
class Car {
    private readonly enginge: Enginge = inject(Enginge);
}
```

For lazy injection use ```inject.lazy``` function.
```typescript
import {inject} from "ironbean";

@component
class Car {
    private readonly enginge: Enginge = inject.lazy(Enginge);
}
```

#### Method injection
You can achieve method injection by using decorator ```@postConstruct```, it's similar principle as the Constructor injection,
with the only difference that method marked as @postConstruct is called after initialization of the component instance
 ```typescript
import {component, postConstruct} from "ironbean";

@component
class Engine {

}

@component
class Car {
    private engine: Engine;
    
    @postConstruct
    injectWheel(engine: Engine) {
        this.engine = engine;
    }
}
```

#### Context injection - not recommended
You can get the instance from context itself using method ```getBean()```.
I don't recommend using this method, because its anti-pattern. It doesn't make sense obtaining whole piano just to get 
an instance of a key when you can ask for the key directly. This option exists here as a last resort in case of some 
difficulties, for example if I would need to create more instances of prototype dependencies within one component. 

 ```typescript
import {component, ApplicationContext} from "ironbean";

@component
class Engine {

}

@component
class Car {
    private engine: Engine;
    
    constructor(context: ApplicationContext) {
        this.engine = context.getBean(Engine);
    }
}
```

### Configuration
For configuration please use ```take``` function.

#### Bind token to class implementation

```typescript
import {take} from "ironbean";

take(ITodoStorage).bindTo(DbTodoStorage);
```

#### Set factory for token

```typescript
import {take} from "ironbean";

take(ITodoStorage).setFactory((context: ComponentContext): ITodoStorage => {
       // factory for create instance
       return createTodoStorage();
});
```

#### Set type for token

Singleton - one instance for all components.
Prototype - one instance for each component.

```typescript
import {take, ComponentType} from "ironbean";

take(ITodoStorage).setType(ComponentType.Singleton);
```

### Async components

A component is async when its instance cannot be created synchronously, typically because
the factory has to await something. Async components are always read with ```getBeanAsync```,
never with ```getBean```.

#### Marking a component async

Extend the ```Async``` class. Constructor dependencies are awaited before the instance is
created, so an async component can depend on other async components.

```typescript
import {Async, component} from "ironbean";

@component
class DbTodoStorage extends Async {
    constructor(private connection: DbConnection) {
        super();
    }
}
```

For dependency tokens use ```DependencyToken.createAsync```.

```typescript
import {DependencyToken} from "ironbean";

const ITodoStorage = DependencyToken.createAsync<ITodoStorage>("TODO_STORAGE");
```

#### Async factories

```typescript
import {take, ComponentContext} from "ironbean";

take(ITodoStorage).setAsyncFactory(async (context: ComponentContext): Promise<ITodoStorage> => {
    const connection = await context.getBeanAsync(DbConnection);
    return new DbTodoStorage(connection);
});
```

A factory class can be used instead. It implements ```IFactoryAsync<T>``` and has to be
a component itself. Parameters of ```createAsync``` are injected, but only when they are
marked with ```@type``` - ```createAsync``` carries no decorator of its own, so without it
no parameter types are emitted and the parameters stay undefined. The same applies to
```create``` of a synchronous ```IFactory<T>```.

```typescript
import {component, take, type, IFactoryAsync} from "ironbean";

@component
class TodoStorageFactory implements IFactoryAsync<ITodoStorage> {
    async createAsync(@type(() => DbConnection) connection: DbConnection): Promise<ITodoStorage> {
        return new DbTodoStorage(connection);
    }
}

take(ITodoStorage).setAsyncFactory(TodoStorageFactory);
```

#### Getting async dependencies

```typescript
import {getBaseApplicationContext} from "ironbean";

const context = getBaseApplicationContext();
const storage = await context.getBeanAsync(ITodoStorage);
```

```getBeanAsync``` is available on both ```ApplicationContext``` and ```ComponentContext```.

#### Post construct

Methods marked with ```@postConstruct``` on an async component are awaited and may take
async dependencies.

```typescript
import {Async, component, postConstruct} from "ironbean";

@component
class TodoList extends Async {
    @postConstruct
    async init(storage: DbTodoStorage) {
        await storage.warmUp();
    }
}
```

#### Restrictions

Asynchronicity propagates. A component is async when it extends ```Async```, when it has an
async factory, when its token was created with ```createAsync```, or when it is a lazy or
collection wrapper around any of those.

- Reading an async component synchronously throws
  ```Getting bean for component <name> failed. Bean has async dependency.```
  This also happens on property access of an ```@autowired``` field.
- A synchronous component cannot take an async dependency, neither in the constructor
  (```Create instance of component <name> failed. Constructor async dependency not supported.```)
  nor in a ```@postConstruct``` method
  (```... PostConstruct async dependency not supported.```).
  Make the depending component async as well, or inject it through ```getBeanAsync```.
- A collection is async when at least one of its members is. The whole collection is then
  resolved asynchronously and keeps member order, so mixing sync and async members is allowed.

An async token keeps accepting the synchronous ```setFactory```. The component stays async
because the token declares it, so the instance is still only readable through
```getBeanAsync``` even though the factory itself returns a value directly. Use
```setAsyncFactory``` on async tokens to keep the declaration and the factory aligned.

#### Testing

```getBeanWithMocksAsync```, ```getMockAsync``` and ```setMockAsyncFactory``` are the async
counterparts of the synchronous testing methods.

```typescript
import {getBaseTestingContext} from "ironbean";

const context = getBaseTestingContext();

context.setMockAsyncFactory(ITodoStorage, async () => new FakeTodoStorage());

const list = await context.getBeanWithMocksAsync(TodoList);
const storage = await context.getMockAsync(ITodoStorage);
```

```setMockAsyncFactory``` throws ```Component <name> is not async.``` for a component that is
not async.

An automatic mock of a dependency token answers any property with a spy, with one exception:
```then``` is never synthesized, so the mock is not thenable. A thenable mock could never be
delivered by ```getBeanAsync```, because a promise is never fulfilled with a thenable, it
adopts it instead - and a synthesized ```then``` never calls back, so awaiting such a mock
would hang forever.