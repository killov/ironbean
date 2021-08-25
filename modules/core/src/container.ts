import {
    ApplicationContext,
    ClassComponent,
    Component,
    component,
    ComponentContext,
    ComponentType,
    constants,
    Dependency,
    DependencyStorage,
    DependencyToken,
    Factory,
    FunctionFactory,
    getDefaultScope,
    IConstructable,
    isFunction,
    ScopeImpl,
    ScopeType,
    TClass,
    TestingContext,
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

    public getBean<T>(Class: TClass<T>): T;
    public getBean<TDependency>(dependency: Dependency<TDependency>): TDependency {
        return this.getComponentInstance(Component.create(dependency));
    }

    public getComponent(component: Component): Component {
        return component.getComponent();
    }

    public getComponentInstance<T>(component: Component): T {
        component = this.getComponent(component);
        if (!component.isInjectable()) {
            throw new Error("I can't instantiate a " + component.name + " that is not a component. ");
        }
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

    protected buildNewInstance<T>(component: IConstructable<T>, componentContainer: ComponentContainer): T {
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

    public setMock<T>(Class: TClass<T>, factory: TClass<T>|FunctionFactory<T>): T;
    public setMock<T>(dependencyToken: DependencyToken<T>, factory: FunctionFactory<T>): T;
    public setMock(component: any, o: any) {
        if (isFunction(o)) {
            this.mockFactories.set(Component.create(component), Factory.create(o));
        } else {
            this.mockFactories.set(Component.create(component), Component.create(o));
        }
    }

    private isComponentForMock(component: Component): boolean {
        return !this.disabledMocks.has(component);
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

    protected runPostConstruct(instance: any, component: Component, componentContainer: ComponentContainer) {
        if (!this.isComponentForMock(component)) {
            super.runPostConstruct(instance, component, componentContainer)
        }
    }

    public getClassInstanceWithMocks<T>(Class: TClass<T>): T {
        this.disableMock(Class);
        return super.getBean(Class);
    }

    public disableMock<T>(Class: TClass<T>, disable: boolean = true) {
        const component = Component.create(Class);
        if (disable) {
            component.collectComponents().forEach(component => {
                this.disabledMocks.add(component);
            })
        } else {
            component.collectComponents().forEach(component => {
                this.disabledMocks.delete(component);
            })
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

export let currentComponentContainer: ComponentContainer | undefined;