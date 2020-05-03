interface IDependence {
    key: Object;
    data?: Object,
    factory?: Function;
}

export class DependencyStorage {
    dependencies: IDependence[] = [];

    saveFactory(key: Object, factory: Function) {
        const id = (Object as any).id(key);
        this.dependencies[id] = this.createDependenceFactory(key, factory);
    }

    saveInstance(key: Object, instance: Object) {
        const id = (Object as any).id(key);
        this.dependencies[id] = this.createDependenceItem(key, instance);
    }

    getFactory(key: Object) {
        const id = (Object as any).id(key);
        return this.dependencies[id]?.factory;
    }

    getInstance(key: Object) {
        const id = (Object as any).id(key);
        return this.dependencies[id]?.data;
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
        return Object.keys(this.dependencies).length;
    }
}
