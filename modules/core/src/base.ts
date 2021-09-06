import {
    Component,
    component,
    ComponentType,
    Container,
    Dependency,
    destroyContainer,
    FunctionFactory,
    getBaseContainer,
    getTestContainer,
    TClass,
    TestContainer
} from "./internals";

@component(ComponentType.Singleton)
export class ApplicationContext {
    private container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.container.getBean(dependency);
    }
}

@component(ComponentType.Singleton)
export class TestingContext extends ApplicationContext {
    private testContainer: TestContainer;

    constructor(container: TestContainer) {
        super(container);
        this.testContainer = container;
    }

    public getBeanWithMocks<T>(Class: TClass<T>): T {
        return this.testContainer.getClassInstanceWithMocks(Class);
    }

    public setMock<T, K extends T>(dependency: Dependency<T>, classFactory: TClass<K>): void {
        this.testContainer.setMock(dependency, classFactory);
    }

    public setMockFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionFactory<K>): void {
        this.testContainer.setMockFactory(dependency, factory);
    }

    public disableMock<T>(Class: TClass<T>): void {
        return this.testContainer.disableMock(Class);
    }

    public enableMock<T>(Class: TClass<T>): void {
        return this.testContainer.disableMock(Class, false);
    }

    public getMock<T>(Class: TClass<T>): T {
        return this.getBean(Class);
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getBean(ApplicationContext);
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    return container.getBean(TestingContext);
}

export function destroyContext(): void {
    destroyContainer();
}

export const ApplicationContextComponent = Component.create(ApplicationContext);
export const TestingContextComponent = Component.create(TestingContext);