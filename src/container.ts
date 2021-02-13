import {component} from "./decorators";
import {ComponentType, constants, ScopeType} from "./enums";
import {TestProvider} from "./testProvider";
import {ApplicationContext, TestingContext} from "./base";
import {DependencyStorage} from "./dependencyStorage";
import {getDefaultScope, ScopeImpl} from "./scope";
import {DependencyKey} from "./dependencyKey";
import {ClassComponent, Component, DependencyComponent} from "./component";

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
        this.storage.saveInstance(ClassComponent.create(Container), this);
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyKey<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        if (dependencyKey.prototype) {
            return this.getComponentInstance(ClassComponent.create(dependencyKey));
        } else {
            return this.getComponentInstance<T>(DependencyComponent.create(dependencyKey));
        }
    }

    public getComponentInstance<T>(component: Component): T {
        const instance = this.storage.getInstance(component);

        if (instance === undefined) {
            if (component.getScope() === this.getScope() || component.isApplicationContext()) {
                const type = component.getType();
                const componentContainer = new ComponentContainer(this);
                const instance = this.buildNewInstance(component, componentContainer);
                if (type === ComponentType.Singleton) {
                    this.storage.saveInstance(component, instance);
                }
                this.runPostConstruct(instance, component, componentContainer);
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

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    protected buildNewInstance<T>(component: Component<T>, componentContainer: ComponentContainer): T {
        const Classes = component.getConstructDependencyList();
        const oldComponentContext = currentComponentContainer;
        currentComponentContainer = componentContainer;
        const instance = component.construct(componentContainer, ...componentContainer.getDependencyList(Classes));
        currentComponentContainer = oldComponentContext;
        if (component instanceof ClassComponent) {
            Reflect.defineMetadata(constants.componentContainer, componentContainer, instance);
        }

        return instance;
    }

    protected runPostConstruct(instance: any, component: Component, componentContainer: ComponentContainer) {
        component.postConstruct(componentContainer, instance);
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

    public setMock<T>(Class: new (...any: any[]) => T, o: T): T;
    public setMock<TDependency>(objectKey: DependencyKey<TDependency>, o: TDependency): TDependency;
    public setMock<T>(component: any, o: T) {
        if (component.prototype) {
            this.setComponentMock(ClassComponent.create(component), o);
        } else {
            this.setComponentMock(DependencyComponent.create(component), o);
        }
    }

    private setComponentMock<T>(component: Component<T>, o: T) {
        this.storage.saveInstance(component, o);
    }

    private isComponentForMock(component: Component): boolean {
        if (<any>component === ClassComponent.create(TestingContext) || <any>component === ClassComponent.create(TestContainer)) {
            return false;
        }
        if (this.disabledMocks.indexOf(component) !== -1) {
            return false;
        }

        return component instanceof ClassComponent;
    }

    protected buildNewInstance<T>(component: Component<T>, componentContainer: ComponentContainer): T {
        if (this.isComponentForMock(component)) {
            if (component instanceof ClassComponent) {
                return this.testProvider.mockClass(component.Class);
            }
        }

        return super.buildNewInstance(component, componentContainer);
    }

    protected runPostConstruct(instance: any, component: Component, componentContainer: ComponentContainer) {
        if (!this.isComponentForMock(component)) {
            super.runPostConstruct(instance, component, componentContainer)
        }
    }

    public getClassInstanceWithMocks<T>(Class: new () => T): T {
        this.disableMock(Class);
        return super.getBean(Class);
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


export class ComponentContainer {
    private container: Container;
    protected readonly storage: DependencyStorage = new DependencyStorage();

    constructor(container: Container) {
        this.container = container;
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyKey<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        if (dependencyKey.prototype) {
            return this.getComponentInstance(ClassComponent.create(dependencyKey));
        } else {
            return this.getComponentInstance<T>(DependencyComponent.create(dependencyKey));
        }
    }

    public getComponentInstance<T>(component: Component): T {
        let instance: any = this.storage.getInstance(component);

        if (instance === undefined) {
            instance = this.container.getComponentInstance(component);
            this.storage.saveInstance(component, instance);
        }

        return instance;
    }
}

export let currentComponentContainer: ComponentContainer | undefined;
