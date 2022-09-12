import {
    ApplicationContext,
    Component,
    component,
    ComponentType,
    Dependency,
    FunctionAsyncFactory,
    FunctionFactory,
    Scope,
    TClass,
    TestContainer,
} from "./internalsTesting";
import {getTestContainer} from "./containerStorageTesting";

export abstract class TestingBaseContext<TContext extends ApplicationContext> extends ApplicationContext {
    private testContainer: TestContainer;

    constructor(container: TestContainer) {
        super(container);
        this.testContainer = container;
    }

    public getBeanWithMocks<T>(dependency: Dependency<T>): T {
        return this.testContainer.getInstanceWithMocks(dependency);
    }

    public getBeanWithMocksAsync<T>(dependency: Dependency<T>): Promise<T> {
        return this.testContainer.getInstanceWithMocksAsync(dependency);
    }

    public setMock<T, K extends T>(dependency: Dependency<T>, classFactory: TClass<K>): void {
        this.testContainer.setMock(dependency, classFactory);
    }

    public setMockFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionFactory<K>): void {
        this.testContainer.setMockFactory(dependency, factory);
    }

    public setMockAsyncFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionAsyncFactory<K>): void {
        this.testContainer.setMockAsyncFactory(dependency, factory);
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

    public getMockAsync<T>(dependency: Dependency<T>): Promise<T> {
        return this.getBeanAsync(dependency);
    }

    public createOrGetParentContext(scope: Scope): TContext {
        return super.createOrGetParentContext(scope) as any;
    }
}

@component(ComponentType.Singleton)
export class TestingContext extends TestingBaseContext<TestingContext> {
    constructor(container: TestContainer) {
        super(container);
    }
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    return container.getBean(TestingContext);
}

export const TestingContextComponent = Component.create(TestingContext);