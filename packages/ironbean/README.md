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
ApplicationContext slouží k získávání závislostí z aktuálního scopu.

#### Získání contextu

ApplicationContext se chová jako běžná komponenta, její intanci můžeme získat přes jakýkoliv typ vložení (viz. typy vložení)

Pokud potřebujeme získat instanci ApplicationContext v globálním prostředí, třeba k ke startu celé aplikace, použijeme funkci getBaseApplicationContext()

 ```typescript
import {getBaseApplicationContext} from "ironbean";

const context = getBaseApplicationContext();
// ukázka spuštění aplikace
const app = context.getBean(Application);
app.run();
  ```

#### Popis metod
- public getBean<T>(dependency: Dependency<T>): T
  - složí k získání závislosti na základě tokenu závislosti.

### ComponentContext
Slouží k získávání závislostí uvnitř komponenty. Chová se velmí podobně jako ApplicationContext, jen s tím rozdílem,
že komponenty typu prototype drží v paměti a nevytváří nové instance. Všechny typy vložení uvnitř komponent využívají interně ComponentContext.

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