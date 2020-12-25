import {autowired, component} from "./decorators";
import {ComponentType, constants, ScopeType} from "./enums";
import {TestProvider} from "./testProvider";
import {ApplicationContext, TestingContext} from "./base";
import {DependencyStorage} from "./dependencyStorage";
import {getDefaultScope, ScopeImpl} from "./scope";
import {DependencyKey} from "./dependencyKey";
import {ClassComponent, Component, DependencyComponent} from "./component";
import {FactoryStorage} from "./factoryStorage";

@component(ComponentType.Singleton)
export class Container {
    protected readonly storage: DependencyStorage = new DependencyStorage();
    protected readonly parent: Container|null;
    protected readonly scope: ScopeImpl;
    protected readonly children: Container[] = [];

    @autowired
    protected factoryStorage!: FactoryStorage;

    constructor(parent: Container|null = null, scope: ScopeImpl|null = null) {
        this.parent = parent;
        this.scope = scope ? scope : getDefaultScope() as ScopeImpl;
    }

    init() {
        this.storage.saveInstance(ClassComponent.create(Container), this);
    }

    addDependenceFactory<TDependency>(key: DependencyKey<TDependency>, factory: () => TDependency) {
        this.factoryStorage.saveFactory(key, factory);
    }

    getDependenceFactory<TDependency>(key: DependencyKey<TDependency>): Function|undefined {
        return this.factoryStorage.getFactory(key);
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        return this.getComponentInstance(ClassComponent.create(Class));
    }

    public getComponentInstance<T>(component: Component): T {
        const instance = this.storage.getInstance(component);

        if (instance === undefined) {
            if (component.getScope() === this.getScope() || component.isApplicationContext()) {
                const type = component.getType();
                const instance = this.buildNewInstance(component);
                if (type === ComponentType.Singleton) {
                    this.storage.saveInstance(component, instance);
                }
                this.runPostConstruct(instance, component);
                return instance;
            } else {
                return this.getContainerForClass(component).getComponentInstance(component);
            }
        }

        return instance as T;
    }

    protected getContainerForClass(component: Component): Container {
        const scope = component.getScope();
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

    public getByKey<TDependency>(objectKey: DependencyKey<TDependency>): TDependency {
        return this.getComponentInstance<TDependency>(DependencyComponent.create(objectKey));
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    protected buildNewInstance<T>(component: Component<T>): T {
        const Classes = component.getConstructDependencyList();
        const oldContainer = currentContainer;
        currentContainer = this;
        const instance = component.construct(this, ...this.getDependencyList(Classes));
        currentContainer = oldContainer;
        if (component instanceof ClassComponent) {
            Reflect.defineMetadata(constants.container, this, instance);
        }

        return instance;
    }

    protected runPostConstruct(instance: any, component: Component) {
        component.postConstruct(this, instance);
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
    private disabledMocks: Component[] = [];

    public init() {
        this.storage.saveInstance(ClassComponent.create(TestContainer), this);
        this.disableMock(FactoryStorage);
    }

    getComponentInstance<T>(component: Component): T {
        if (<any>component === ClassComponent.create(ApplicationContext) || <any>component === ClassComponent.create(TestingContext)) {
            return super.getComponentInstance(ClassComponent.create(TestingContext));
        }
        if (<any>component === ClassComponent.create(Container) || <any>component === ClassComponent.create(TestContainer)) {
            return super.getComponentInstance(ClassComponent.create(TestContainer));
        }

        return super.getComponentInstance(component);
    }

    protected buildNewInstance<T>(component: Component<T>): T {
        if (<any>component === ClassComponent.create(TestingContext) || <any>component === ClassComponent.create(TestContainer)) {
            return super.buildNewInstance(component);
        }
        if (this.disabledMocks.indexOf(component) !== -1) {
            return super.buildNewInstance(component);
        }

        if (component instanceof ClassComponent) {
            return this.testProvider.mockClass(component.Class);
        }

        return super.buildNewInstance(component);
    }

    public getClassInstanceWithMocks<T>(Class: new () => T): T {
        this.disableMock(Class);
        return super.getClassInstance(Class);
    }

    public disableMock<T>(Class: new () => T) {
        this.disabledMocks.push(ClassComponent.create(Class));
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
