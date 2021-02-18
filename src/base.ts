import {
    ComponentContainer,
    Container,
    destroyContainer,
    getBaseContainer,
    getTestContainer,
    TestContainer
} from "./container";
import {ComponentType} from "./enums";
import {component} from "./decorators";
import {TestProvider} from "./testProvider";
import {DependencyToken} from "./dependencyToken";

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

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.container.getBean(dependencyKey);
    }
}

@component(ComponentType.Prototype)
export class ComponentContext {
    private container: ComponentContainer;

    constructor(container: ComponentContainer) {
        this.container = container;
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
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

    public getBeanWithMocks<T>(Class: new (...any: any[]) => T): T {
        return this.testContainer.getClassInstanceWithMocks(Class);
    }

    public setMock<T>(Class: new (...any: any[]) => T, instance: T): T;
    public setMock<TDependency>(dependencyKey: DependencyToken<TDependency>, instance: TDependency): TDependency;
    public setMock(Class: any, instance: any) {
        return this.testContainer.setMock(Class, instance);
    }

    public disableMock<T>(Class: new (...any: any[]) => T) {
        return this.testContainer.disableMock(Class);
    }

    public getMock<T>(Class: new (...any: any[]) => T): T {
        return this.getBean(Class);
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getBean(ApplicationContext);
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    container.setTestProvider(new TestProvider());
    return container.getBean(TestingContext);
}

export function destroyContext(): void {
    destroyContainer();
}

