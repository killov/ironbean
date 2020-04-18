import {component} from "./decorators";
import {ComponentType, constants} from "./enums";

@component(ComponentType.Singleton)
export class Container {
    dependencies: Object[] = [];

    init() {
        const id = (Object as any).id(Container);
        this.dependencies[id] = this;
    }

    getDependency<T>(Class: new () => T): T {
        const id = (Object as any).id(Class);

        if (!this.dependencies[id]) {
            const type = this.getType(Class);
            const instance = this.buildNewInstance(Class);
            if (type === ComponentType.Singleton) {
                this.dependencies[id] = instance;
            }
            this.runPostConstruct(instance);
            return instance;
        }

        return this.dependencies[id] as T;
    }

    getDependencyList(Classes?: (new () => Object)[]) {
        if (!Classes) {
            return [];
        }

        return Classes.map(Class => this.getDependency(Class));
    }

    private getType(Class: new () => any): ComponentType | undefined {
        return Reflect.getMetadata(constants.componentType, Class);
    }

    private buildNewInstance<T>(Class: new () => T): T {
        const Classes = Reflect.getMetadata("design:paramtypes", Class);
        return new (Class as any)(...this.getDependencyList(Classes));
    }

    private runPostConstruct(instance: any) {
        for (let key in instance) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                const Classes = Reflect.getMetadata("design:paramtypes", instance, key);
                (instance[key] as Function).apply(instance, this.getDependencyList(Classes));
            }
        }
    }
}

let container: Container;
export function getBaseContainer() {
    if (!container) {
        container = new Container();
        container.init();
    }

    return container;
}