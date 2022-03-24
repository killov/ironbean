import {
    ApplicationContext,
    Component,
    component,
    ComponentType,
    Dependency,
    FunctionFactory,
    TClass,
    TestContainer
} from "./internalsTesting";
import {getTestContainer} from "./containerStorageTesting";

@component(ComponentType.Singleton)
export class TestingContext extends ApplicationContext {
    private testContainer: TestContainer;

    constructor(container: TestContainer) {
        super(container);
        this.testContainer = container;
    }

    public getBeanWithMocks<T>(dependency: Dependency<T>): T {
        return this.testContainer.getInstanceWithMocks(dependency);
    }

    public setMock<T, K extends T>(dependency: Dependency<T>, classFactory: TClass<K>): void {
        this.testContainer.setMock(dependency, classFactory);
    }

    public setMockFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionFactory<K>): void {
        this.testContainer.setMockFactory(dependency, factory);
    }

    public disableMock<T>(dependency: Dependency<T>): void {
        return this.testContainer.disableMock(dependency);
    }

    public enableMock<T>(dependency: Dependency<T>): void {
        return this.testContainer.disableMock(dependency, false);
    }

    public getMock<T>(dependency: Dependency<T>): T {
        return this.getBean(dependency);
    }
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    return container.getBean(TestingContext);
}

export const TestingContextComponent = Component.create(TestingContext);
