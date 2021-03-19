import {
    ApplicationContext,
    ClassComponent,
    Component,
    component, ComponentContext,
    ComponentType, constants,
    DependencyStorage,
    DependencyToken,
    getDefaultScope,
    ScopeImpl, ScopeType, TestingContext, TestProvider
} from "./internals";

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
        this.storage.saveInstance(Component.create(Container), this);
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.getComponentInstance(this.getComponent(Component.create(dependencyKey)));
    }

    public getComponent(component: Component): Component {
        return component.getComponent();
    }

    public getComponentInstance<T>(component: Component): T {
        component = this.getComponent(component);
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
        this.storage.saveInstance(Component.create(TestContainer), this);
        this.disableMock(TestProvider);
        this.testProvider = this.getBean(TestProvider);
    }

    public getComponent(component: Component): Component {
        if (<any>component === Component.create(ApplicationContext) || <any>component === Component.create(TestingContext)) {
            return Component.create(TestingContext);
        }
        if (<any>component === Component.create(Container) || <any>component === Component.create(TestContainer)) {
            return Component.create(TestContainer);
        }

        if (!this.isComponentForMock(component)) {
            return super.getComponent(component);
        }
        return component;
    }

    public setMock<T>(Class: new (...any: any[]) => T, o: T): T;
    public setMock<TDependency>(objectKey: DependencyToken<TDependency>, o: TDependency): TDependency;
    public setMock<T>(component: any, o: T) {
        this.setComponentMock(Component.create(component), o);
    }

    private setComponentMock<T>(component: Component<T>, o: T) {
        this.storage.saveInstance(component, o);
    }

    private isComponentForMock(component: Component): boolean {
        if (<any>component === Component.create(TestingContext) || <any>component === Component.create(TestContainer)) {
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
        this.disabledMocks.push(Component.create(Class));
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

@component(ComponentType.Singleton)
export class ComponentContainer {
    private container: Container;
    protected readonly storage: DependencyStorage = new DependencyStorage();

    constructor(container: Container) {
        this.container = container;
        this.storage.saveInstance(Component.create(ComponentContainer), this);
        this.storage.saveInstance(Component.create(ComponentContext), new ComponentContext(this));
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.getComponentInstance(Component.create(dependencyKey));
    }

    public getComponentInstance<T>(component: Component): T {
        component = this.container.getComponent(component);
        let instance: any = this.storage.getInstance(component);

        if (instance === undefined) {
            instance = this.container.getComponentInstance(component);
            this.storage.saveInstance(component, instance);
        }

        return instance;
    }
}

export let currentComponentContainer: ComponentContainer | undefined;
