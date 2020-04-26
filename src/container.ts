import {component} from "./decorators";
import {ComponentType, constants} from "./enums";
import {TestProvider} from "./testProvider";
import {ApplicationContext, TestingContext} from "./base";

@component(ComponentType.Singleton)
export class Container {
    dependencies: Object[] = [];
    factories: Function[] = [];

    init() {
        const id = (Object as any).id(Container);
        this.dependencies[id] = this;
    }

    addDependenceFactory(key: Object, factory: Function) {
        const id = (Object as any).id(key);
        this.factories[id] = factory;
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        const id = (Object as any).id(Class);

        if (!this.dependencies[id]) {
            const type = this.getComponentType(Class);
            const instance = this.buildNewInstance(Class);
            if (type === ComponentType.Singleton) {
                this.dependencies[id] = instance;
            }
            this.runPostConstruct(instance, Class);
            return instance;
        }

        return this.dependencies[id] as T;
    }

    public getByKey(objectKey: Object): any {
        const id = (Object as any).id(objectKey);

        if (!this.dependencies[id]) {
            const factory = this.factories[id];
            if (!factory) {
                throw new Error("Factory for " + objectKey + "not found.");
            }
            this.dependencies[id] = factory();
        }

        return this.dependencies[id];
    }

    protected getDependencyList(Classes: (new () => Object)[]|undefined, objectKeys: any[] = []) {
        if (!Classes) {
            return [];
        }

        const map = Classes.map((Class, i) => !objectKeys[i] && this.getClassInstance(Class as any));
        if (objectKeys) {
            objectKeys.forEach((obj, index) => {
                if (obj) {
                    map[index] = this.getByKey(obj);
                }
            })
        }

        return map;
    }

    protected getComponentType(Class: new () => any): ComponentType | undefined {
        return Reflect.getMetadata(constants.componentType, Class);
    }

    protected buildNewInstance<T>(Class: new () => T): T {
        const Classes = Reflect.getMetadata("design:paramtypes", Class);
        const objectKeys = Reflect.getMetadata(constants.keys, Class);
        return new (Class as any)(...this.getDependencyList(Classes, objectKeys));
    }

    protected runPostConstruct(instance: any, Class: any) {
        for (let key in Class.prototype) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                const Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key);
                const objectKeys = Reflect.getOwnMetadata(constants.keys, Class.prototype, key);
                (instance[key] as Function).apply(instance, this.getDependencyList(Classes, objectKeys));
            }
        }
    }
}

@component(ComponentType.Singleton)
export class TestContainer extends Container {
    private testProvider!: TestProvider;

    public init() {
        const id = (Object as any).id(TestContainer);
        this.dependencies[id] = this;
    }

    public getClassInstance<T>(Class: new () => T): T {
        if (<any>Class === ApplicationContext || <any>Class === TestingContext) {
            return super.getClassInstance(TestingContext as any);
        }
        if (<any>Class === Container || <any>Class === TestContainer) {
            return super.getClassInstance(TestContainer as any);
        }

        const id = (Object as any).id(Class);

        if (!this.dependencies[id]) {
            const type = this.getComponentType(Class);
            const instance = this.testProvider.mockClass(Class);
            if (type === ComponentType.Singleton) {
                this.dependencies[id] = instance;
            }
            return instance;
        }

        return this.dependencies[id] as T;
    }

    public getClassInstanceWithMocks<T>(Class: new () => T): T {
        return super.getClassInstance(Class);
    }

    public setTestProvider(testProvider: TestProvider) {
        this.testProvider = testProvider;
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

    return container as TestContainer;
}

export function destroyContainer(): void {
    container = null;
}
