import {component} from "./decorators";
import {ComponentType, constants} from "./enums";

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

    public getClassInstance<T>(Class: new () => T): T {
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

    protected getDependencyList(Classes: (new () => Object)[]|undefined, objectKeys: any[]) {
        if (!Classes) {
            return [];
        }

        const map = Classes.map(Class => this.getClassInstance(Class as any));
        if (objectKeys) {
            objectKeys.forEach((obj, index) => {
                if (obj) {
                    map[index] = this.getByKey(obj);
                }
            })
        }

        return map;
    }

    private getComponentType(Class: new () => any): ComponentType | undefined {
        return Reflect.getMetadata(constants.componentType, Class);
    }

    private buildNewInstance<T>(Class: new () => T): T {
        const Classes = Reflect.getMetadata("design:paramtypes", Class);
        const objectKeys = Reflect.getMetadata(constants.keys, Class);
        return new (Class as any)(...this.getDependencyList(Classes, objectKeys));
    }

    private runPostConstruct(instance: any, Class: any) {
        for (let key in Class.prototype) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                const Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key);
                const objectKeys = Reflect.getOwnMetadata(constants.keys, Class.prototype, key);
                (instance[key] as Function).apply(instance, this.getDependencyList(Classes, objectKeys));
            }
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

export function destroyBaseContainer(): void {
    container = null;
}