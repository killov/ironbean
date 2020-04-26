import {Container, destroyContainer, getBaseContainer, getTestContainer, TestContainer} from "./container";
import {ComponentType} from "./enums";
import {component} from "./decorators";
import {JasmineTestProvider, TestProvider} from "./testProvider";

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

    public getBean<T>(Class: new (...any: any[]) => T): T {
        return this.container.getClassInstance(Class);
    }

    public addDependenceFactory(key: object, factory: Function) {
        this.container.addDependenceFactory(key, factory);
    }

    public getDependence(key: object) {
        return this.container.getByKey(key);
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

    public setTestProvider(testProvider: TestProvider): void {
        return this.testContainer.setTestProvider(testProvider)
    }

    public useJasmineTestProvider(): void {
        return this.setTestProvider(new JasmineTestProvider());
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getClassInstance(ApplicationContext);
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    return container.getClassInstance(TestingContext);
}

export function destroyBaseApplicationContext(): void {
    destroyContainer();
}

