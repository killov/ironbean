interface IDependence {
    key: Object;
    data?: Object,
    factory?: Function;
}

export class DependencyStorage {
    dependencies: Map<object, IDependence> = new Map<object, IDependence>();

    saveFactory(key: Object, factory: Function) {
        this.dependencies.set(key, this.createDependenceFactory(key, factory));
    }

    saveInstance(key: Object, instance: Object) {
        this.dependencies.set(key, this.createDependenceItem(key, instance));
    }

    getFactory(key: Object) {
        return this.dependencies.get(key)?.factory;
    }

    getInstance(key: Object) {
        return this.dependencies.get(key)?.data;
    }

    protected createDependenceItem(key: Object, data: any): IDependence {
        return {
            key: key,
            data: data,
        }
    }

    protected createDependenceFactory(key: Object, factory: Function): IDependence {
        return {
            key: key,
            factory: factory,
        }
    }

    countOfDependencies(): number {
        return this.dependencies.size;
    }
}