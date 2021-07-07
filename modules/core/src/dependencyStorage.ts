interface IDependence {
    key: Object;
    data: Object,
}

export class DependencyStorage {
    dependencies: Map<object, IDependence> = new Map<object, IDependence>();

    saveInstance(key: Object, instance: Object) {
        this.dependencies.set(key, this.createDependenceItem(key, instance));
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

    countOfDependencies(): number {
        return this.dependencies.size;
    }
}
