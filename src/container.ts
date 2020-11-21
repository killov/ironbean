import {component} from "./decorators";
import {ComponentType, constants, ScopeType} from "./enums";
import {TestProvider} from "./testProvider";
import {ApplicationContext, TestingContext} from "./base";
import {DependencyStorage} from "./dependencyStorage";
import {getDefaultScope, ScopeImpl} from "./scope";
import {DependencyKey} from "./dependencyKey";
import {destroyFieldsForAutowired, getAllPropertyNames} from "./utils";

@component(ComponentType.Singleton)
export class Container {
    protected readonly storage: DependencyStorage = new DependencyStorage();
    protected readonly parent: Container|null;
    protected readonly scope: ScopeImpl;
    protected readonly children: Container[] = [];

    constructor(parent: Container|null = null, scope: ScopeImpl|null = null) {
        this.parent = parent;
        this.scope = scope ? scope : getDefaultScope() as ScopeImpl;
    }

    init() {
        this.storage.saveInstance(Container, this);
    }

    addDependenceFactory<TDependency>(key: DependencyKey<TDependency>, factory: () => TDependency) {
        this.storage.saveFactory(key, factory);
    }

    private isApplicationContext(Class: any): boolean {
        return Class === ApplicationContext || Class === TestingContext || Class === Container;
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        const instance = this.storage.getInstance(Class);

        if (!instance) {
            if (this.getComponentScope(Class) === this.getScope() || this.isApplicationContext(Class)) {
                const type = this.getComponentType(Class);
                const instance = this.buildNewInstance(Class);
                if (type === ComponentType.Singleton) {
                    this.storage.saveInstance(Class, instance);
                }
                this.runPostConstruct(instance, Class);
                return instance;
            } else {
                return this.getContainerForClass(Class).getClassInstance(Class);
            }
        }

        return instance as T;
    }

    protected getContainerForClass<T>(Class: new (...any: any[]) => T): Container {
        const scope = this.getComponentScope(Class);
        const commonScope = ScopeImpl.getCommonParent(scope, this.getScope());
        const commonContainer = this.getParentContainerByScope(commonScope);

        return commonContainer.getContainerForClassInternal(scope);
    }

    protected getParentContainerByScope(scope: ScopeImpl): Container {
        if (this.getScope() === scope) {
            return this;
        }
        const parent = this.parent;

        if (parent === null) {
            throw new Error();
        }

        return parent.getParentContainerByScope(scope);
    }

    private getContainerForClassInternal(scope: ScopeImpl): Container {
        if (scope === this.getScope()) {
            return this;
        }
        const childScope = this.getScope().getChildScopeDirectionTo(scope);
        const scopeId = childScope.getId();
        let container = this.children[scopeId];
        if (container) {
            return container
        }
        container = new Container(this, childScope);
        if (childScope.getType() === ScopeType.Singleton) {
            this.children[scopeId] = container;
        }
        container.init();
        return container.getContainerForClassInternal(scope);
    }

    public getByKey(objectKey: Object): any {
        const instance = this.storage.getInstance(objectKey);

        if (!instance) {
            const factory = this.storage.getFactory(objectKey);
            if (!factory) {
                throw new Error("Factory for " + objectKey + "not found.");
            }
            const instance = factory();
            this.storage.saveInstance(objectKey, instance);
            return instance;
        }

        return instance;
    }

    protected getDependencyList(Classes: (new () => Object)[]|undefined, objectKeys: any[] = []) {
        if (!Classes) {
            return [];
        }

        const map = Classes.map((Class, i) => !objectKeys[i] && this.getClassInstance(Class as any));
        if (objectKeys) {
            objectKeys.forEach((obj, index) => {
                if (obj) {
                    map[index] = this.getByKey(obj);
                }
            })
        }

        return map;
    }

    protected getComponentType(Class: new () => any): ComponentType | undefined {
        return Reflect.getMetadata(constants.componentType, Class);
    }

    protected getComponentScope(Class: new () => any): ScopeImpl {
        return Reflect.getMetadata(constants.scope, Class) || getDefaultScope();
    }

    protected buildNewInstance<T>(Class: new () => T): T {
        const Classes = Reflect.getMetadata("design:paramtypes", Class);
        const objectKeys = Reflect.getMetadata(constants.keys, Class);
        const oldContainer = currentContainer;
        currentContainer = this;
        const instance = new (Class as any)(...this.getDependencyList(Classes, objectKeys));
        currentContainer = oldContainer;
        Reflect.defineMetadata(constants.container, this, instance);
        destroyFieldsForAutowired(instance);

        return instance;
    }

    protected runPostConstruct(instance: any, Class: any) {
        for (let key of getAllPropertyNames(Class.prototype)) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                const Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key);
                const objectKeys = Reflect.getOwnMetadata(constants.keys, Class.prototype, key);
                (instance[key] as Function).apply(instance, this.getDependencyList(Classes, objectKeys));
            }
        }
    }

    protected getScope(): ScopeImpl {
        return this.scope;
    }

    public countOfDependencies(): number {
        return this.storage.countOfDependencies();
    }
}

@component(ComponentType.Singleton)
export class TestContainer extends Container {
    private testProvider!: TestProvider;
    private disabledMocks: (new(...any: any[]) => any)[] = [];

    public init() {
        this.storage.saveInstance(TestContainer, this);
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        if (<any>Class === ApplicationContext || <any>Class === TestingContext) {
            return super.getClassInstance(TestingContext as any);
        }
        if (<any>Class === Container || <any>Class === TestContainer) {
            return super.getClassInstance(TestContainer as any);
        }
        if (this.disabledMocks.indexOf(Class) !== -1) {
            return super.getClassInstance(Class);
        }

        const instance = this.storage.getInstance(Class);

        if (!instance) {
            const type = this.getComponentType(Class);
            const instance = this.testProvider.mockClass(Class);
            if (type === ComponentType.Singleton) {
                this.storage.saveInstance(Class, instance)
            }
            return instance;
        }

        return instance as T;
    }

    public getClassInstanceWithMocks<T>(Class: new () => T): T {
        return super.getClassInstance(Class);
    }

    public disableMock<T>(Class: new () => T) {
        this.disabledMocks.push(Class);
    }

    public setTestProvider(testProvider: TestProvider) {
        this.testProvider = testProvider;
    }
}

let container: Container | null;
export function getBaseContainer(): Container {
    if (!container) {
        container = new Container();
        container.init();
    }

    return container;
}

export function getTestContainer(): TestContainer {
    if (!container) {
        container = new TestContainer();
        container.init();
    }

    if (!(container instanceof TestContainer)) {
        throw new Error("You can't get test container because another container already exists.");
    }

    return container;
}

export function destroyContainer(): void {
    container = null;
}

export let currentContainer: Container | undefined;
