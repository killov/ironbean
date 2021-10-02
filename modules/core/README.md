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

- [Class component](#Class component)
- [Dependency token](#Dependency token)

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
        ...
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
   


