import {
    ApplicationContextComponent,
    ClassComponent,
    Component,
    component,
    ComponentContext,
    ComponentType,
    Dependency,
    DependencyStorage,
    Factory,
    FunctionFactory,
    getDefaultScope,
    IConstructable,
    ScopeImpl,
    ScopeType,
    TClass,
    TestingContext,
    TestingContextComponent,
    TestProvider
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
        this.storage.saveInstance(Component.create<Container>(Container), this);
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.getComponentInstance(Component.create(dependency));
    }

    public getComponent(component: Component): Component {
        return component.getComponent();
    }

    public getComponentInstance<T>(component: Component<T>): T {
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
                return this.getContainerForComponent(component).getComponentInstance(component);
            }
        }

        return instance as T;
    }

    protected getContainerForComponent(component: Component): Container {
        const scope = component.getScope();
        const commonScope = ScopeImpl.getCommonParent(scope, this.getScope());
        const commonContainer = this.getParentContainerByScope(commonScope);

        return commonContainer.getContainerForScope(scope);
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

    private getContainerForScope(scope: ScopeImpl): Container {
        if (scope === this.getScope()) {
            return this;
        }
        const childScope = this.getScope().getDirectChildFor(scope);
        const scopeId = childScope.getId();
        let container = this.children[scopeId];
        if (container) {
            return container;
        }
        container = new Container(this, childScope);
        if (childScope.getType() === ScopeType.Singleton) {
            this.children[scopeId] = container;
        }
        container.init();
        return container.getContainerForScope(scope);
    }

    protected buildNewInstance<T>(component: IConstructable<T>, componentContainer: ComponentContainer): T {
        if (!component.isConstructable()) {
            throw new Error("I can't instantiate a " + component.name + " that is not a component.");
        }
        const oldComponentContext = currentComponentContainer;
        currentComponentContainer = componentContainer;
        const instance = component.construct(componentContainer);
        currentComponentContainer = oldComponentContext;

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
    private disabledMocks: Set<Component> = new Set<Component>();
    private mockFactories: Map<Component, IConstructable<any>> = new Map<Component, IConstructable<any>>();

    public init() {
        this.storage.saveInstance(Component.create<TestContainer>(TestContainer), this);
        this.disableMock(TestProvider);
        this.disableMock(TestingContext);
        this.disableMock(TestContainer);
        this.testProvider = this.getBean(TestProvider);
    }

    public getComponent(component: Component): Component {
        if (component === ApplicationContextComponent || component === TestingContextComponent) {
            return TestingContextComponent;
        }
        if (component === ContainerComponent || component === TestContainerComponent) {
            return TestContainerComponent;
        }

        return super.getComponent(component);
    }

    public setMock<T, K extends T>(dependency: Dependency<T>, factory: TClass<K>): void {
        const mockedComponent = this.getComponent(Component.create(dependency));
        const factoryComponent = Component.create(factory);
        if (!factoryComponent.isConstructable()) {
            throw new Error("Mock factory " + factoryComponent.name + " for dependency " + mockedComponent.name + " must be @component.");
        }
        this.mockFactories.set(mockedComponent, factoryComponent);
    }

    public setMockFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionFactory<K>): void {
        const mockedComponent = this.getComponent(Component.create(dependency));
        this.mockFactories.set(mockedComponent, Factory.create(factory));
    }

    private isComponentForMock(component: Component): boolean {
        return !this.disabledMocks.has(this.getComponent(component));
    }

    protected buildNewInstance<T>(component: Component<T>, componentContainer: ComponentContainer): T {
        if (this.isComponentForMock(component)) {
            if (this.mockFactories.has(component)) {
                return super.buildNewInstance(this.mockFactories.get(component)!, componentContainer)
            }
            if (component instanceof ClassComponent) {
                return this.testProvider.mockClass(component.Class as any);
            }
        }

        return super.buildNewInstance(component, componentContainer);
    }

    protected runPostConstruct<T>(instance: T, component: Component<T>, componentContainer: ComponentContainer) {
        if (!this.isComponentForMock(component)) {
            super.runPostConstruct(instance, component, componentContainer)
        }
    }

    public getClassInstanceWithMocks<T>(Class: TClass<T>): T {
        this.disableMock(Class);
        return super.getBean(Class);
    }

    public disableMock<T>(Class: TClass<T>, disable: boolean = true) {
        const component = this.getComponent(Component.create(Class));
        if (disable) {
            this.disabledMocks.add(component);
        } else {
            this.disabledMocks.delete(component);
        }
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
        this.storage.saveInstance(Component.create<ComponentContainer>(ComponentContainer), this);
        this.storage.saveInstance(Component.create(ComponentContext), new ComponentContext(this));
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    public getBean<TDependency>(dependency: Dependency<TDependency>): TDependency {
        return this.getComponentInstance(Component.create(dependency));
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

const ContainerComponent = Component.create(Container);
const TestContainerComponent = Component.create(TestContainer);

export let currentComponentContainer: ComponentContainer | undefined;
