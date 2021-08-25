import {
    component,
    ComponentType,
    Container,
    DependencyToken,
    destroyContainer,
    FunctionFactory,
    getBaseContainer,
    getTestContainer,
    TClass,
    TestContainer
} from "./internals";

(function() {
    if (typeof (Object as any).id === "undefined") {
        let id = 0;

        (Object as any).id = function(o: any) {
            if (typeof o.__uniqueid === "undefined") {
                Object.defineProperty(o, "__uniqueid", {
                    value: ++id,
                    enumerable: false,
                    writable: false
                });
            }

            return o.__uniqueid;
        };
    }
})();

@component(ComponentType.Singleton)
export class ApplicationContext {
    private container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    public getBean<T>(Class: TClass<T>): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.container.getBean(dependencyKey);
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

    public setMock<T>(Class: TClass<T>, factory: TClass<T>|FunctionFactory<T>): void;
    public setMock<T>(dependencyToken: DependencyToken<T>, factory: FunctionFactory<T>): void;
    public setMock(Class: any, instance: any): void {
        return this.testContainer.setMock(Class, instance);
    }

    public disableMock<T>(Class: TClass<T>) {
        return this.testContainer.disableMock(Class);
    }

    public enableMock<T>(Class: TClass<T>) {
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

