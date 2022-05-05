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
- public getBean<T>(dependency: Dependency<T>): T
  - is used for getting dependencies
  - we need dependency token

### ComponentContext
ComponentContext is used for getting dependencies intro component.
Behaviour is almost the same as ApplicationContext, the difference is that component with type prototype
memorizes instances that were created in previous request of the same dependency token.
All types of injection inside the components used in background ComponentContext.

### Typy vložení v class Komponentách
#### Vložení přes constructor
K získání instance přes konstruktor se používá intuitivně, pokud máme typescript s reflexí, stačí uvést typ třídy, pokud ne využijeme dekorátor @type

 ```typescript
import {component} from "ironbean";

@component()
class Wheel {
    
}

@component()
class Car {
    private readonly wheel: Wheel;

    constructor(wheel: Wheel) {
        this.wheel = wheel;
    }
}
```

#### Vložení přes vlastnost
K vložení instance do vlastnosti slouží dekorátor @autowired, pokud nemám reflexi, použiji @type.

 ```typescript
import {component, autowired} from "ironbean";

@component()
class Wheel {

}

@component()
class Car {
    @autowired
    private readonly wheel: Wheel;
}
```

#### Vložení přes metodu
K získání instance přes metodu lze docílit díky decorátoru @postConstruct, podobný princip jako u constructor vložení, jen st ím rozdílem,
že metoda označená jako @postConstrut se volá po vytvoření instance komponenty.

 ```typescript
import {component, postConstruct} from "ironbean";

@component()
class Wheel {

}

@component()
class Car {
    private readonly wheel: Wheel;
    
    @postConstruct
    injectWheel(wheel: Wheel) {
        this.wheel = wheel;
    }
}
```

#### Vytáhnutí z kontextu
Instanci závislosti jsme schopni získat i ze samotného kontextu přes metodu getBean().
Tuhle metodu vložení nedoporučuji, jedná se o antipatern, nedává mi totiž smysl tahat klavír, abych získal instanci klávesy, když si rovnou můžu říci o klávesu.
Tato možnost tu existuje jako poslední varianta při nějakých nesnázích,
třeba, že bych potřeboval vytvořit více instancí prototype závislostí v rámci jedné komponenty.