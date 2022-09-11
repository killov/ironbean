import {
    ApplicationContextComponent, AsyncFactory,
    ClassComponent,
    Component,
    component,
    ComponentContainer,
    ComponentType,
    Container,
    ContainerComponent,
    Dependency,
    DependencyComponent,
    Factory, FunctionAsyncFactory,
    FunctionFactory,
    IConstructable,
    Instance, isPrimitive,
    ScopeImpl,
    TClass,
    TestingContext,
    TestingContextComponent,
    TestProvider
} from "./internalsTesting";

@component(ComponentType.Singleton)
export class TestContainer extends Container {
    private testProvider!: TestProvider;
    private disabledMocks: Set<Component> = new Set<Component>();
    private mockFactories: Map<Component, IConstructable<any>> = new Map<Component, IConstructable<any>>();

    public init() {
        this.storage.saveInstance(Component.create<TestContainer>(TestContainer), new Instance(this));
        this.disableMock(TestProvider);
        this.disableMock(TestingContext);
        this.disableMock(TestContainer);
        this.testProvider = this.getBean(TestProvider);
    }

    protected createContainer(scope: ScopeImpl): TestContainer {
        const container = new TestContainer(this, scope);
        container.init();

        return container;
    }

    public getComponent(component: Component): Component {
        switch (component) {
            case ApplicationContextComponent:
            case TestingContextComponent:
                return TestingContextComponent;
            case ContainerComponent:
            case TestContainerComponent:
                return TestContainerComponent;
            default:
                return super.getComponent(component);
        }
    }

    protected isConstructable<T>(component: Component<T>): boolean {
        return this.mockFactories.has(component) || super.isConstructable(component);
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

    public setMockAsyncFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionAsyncFactory<K>): void {
        const mockedComponent = this.getComponent(Component.create(dependency));
        if (!mockedComponent.isAsync()) {
            throw new Error("Component " + mockedComponent.name + " is not async.");
        }
        this.mockFactories.set(mockedComponent, AsyncFactory.create(factory));
    }

    private isComponentForMock(component: Component): boolean {
        return !this.disabledMocks.has(this.getComponent(component));
    }

    protected buildNewInstance<T>(component: Component<T>, componentContainer: ComponentContainer): Instance<T> {
        if (this.isComponentForMock(component)) {
            if (this.mockFactories.has(component)) {
                return super.buildNewInstance(this.mockFactories.get(component)!, componentContainer)
            }
            if (component instanceof ClassComponent) {
                return new Instance(this.testProvider.mockClass(component.Class as any));
            }
            if (component instanceof DependencyComponent) {
                const classType = component.getClassType();
                if (classType !== undefined) {
                    if (isPrimitive(classType)) {
                        return new Instance(this.testProvider.mockPrimitive(classType));
                    }
                    return new Instance(this.testProvider.mockClass(classType));
                }
                return new Instance(this.testProvider.mockUnknown<T>(component.key));
            }
        }

        return super.buildNewInstance(component, componentContainer);
    }

    protected runPostConstruct<T>(instance: Instance<T>, component: Component<T>, componentContainer: ComponentContainer) {
        if (!this.isComponentForMock(component)) {
            super.runPostConstruct(instance, component, componentContainer)
        }
    }

    public getInstanceWithMocks<T>(dependency: Dependency<T>): T {
        this.disableMock(dependency);
        return super.getBean(dependency);
    }

    public getInstanceWithMocksAsync<T>(dependency: Dependency<T>): Promise<T> {
        this.disableMock(dependency);
        return super.getBeanAsync(dependency);
    }

    public disableMock<T>(dependency: Dependency<T>, disable: boolean = true) {
        const component = this.getComponent(Component.create(dependency));
        if (disable) {
            this.disabledMocks.add(component);
        } else {
            this.disabledMocks.delete(component);
        }
    }
}

export const TestContainerComponent = Component.create(TestContainer);