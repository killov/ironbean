import {Component} from "./component";

interface IDependence<T> {
    component: Component<T>;
    instance: T,
}

export class DependencyStorage {
    dependencies: Map<object, IDependence<any>> = new Map<object, IDependence<any>>();

    saveInstance<T>(component: Component<T>, instance: T) {
        this.dependencies.set(component, this.createDependenceItem(component, instance));
    }

    getInstance<T>(key: Component<T>): T|undefined {
        return this.dependencies.get(key)?.instance;
    }

    protected createDependenceItem<T>(component: Component<T>, instance: T): IDependence<T> {
        return {
            component: component,
            instance: instance
        };
    }

    countOfDependencies(): number {
        return this.dependencies.size;
    }
}
