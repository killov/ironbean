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

    public getMock<T>(Class: new (...any: any[]) => T): T {
        return this.getBean(Class);
    }
}

export class JasmineTestingContext extends TestingContext {
    public getMock<T>(Class: new (...any: any[]) => T): jasmine.SpyObj<T> {
        return super.getMock(Class) as jasmine.SpyObj<T>;
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getClassInstance(ApplicationContext);
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    container.setTestProvider(new TestProvider());
    return container.getClassInstance(TestingContext);
}

export function getBaseJasmineTestingContext(): JasmineTestingContext {
    const container = getTestContainer();
    container.setTestProvider(new JasmineTestProvider());
    return container.getClassInstance(TestingContext as any) as JasmineTestingContext;
}

export function destroyContext(): void {
    destroyContainer();
}

