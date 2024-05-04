import {
    AsyncInstance,
    ClassComponent,
    ComponentContainer,
    constants,
    containerStorage,
    getAllPropertyNames,
    Instance,
    TClass,
    TNormalClass
} from "./internals";

export class AsyncClassComponent<T> extends ClassComponent<T> {

    public static create<T>(Class: TClass<T>): ClassComponent<T> {
        return new AsyncClassComponent<T>(Class);
    }

    public construct(container: ComponentContainer): Instance<T> {
        if (this.factory) {
            return this.factory.construct(container);
        }

        const asyncParams = container.getDependencyListAsync(this.getConstructDependencyList());
        const Class = this._Class as TNormalClass<T>;

        const promiseFactory = async () => {
            const params = await Promise.all(asyncParams);
            const instance = containerStorage.currentComponentContainerAction(container, () => new Class(...params));
            // @ts-ignore
            Reflect.defineMetadata(constants.componentContainer, container, instance);
            return instance;
        }

        return new Instance(new AsyncInstance(promiseFactory()) as any);
    }

    public postConstruct(container: ComponentContainer, instance: Instance<any>): void {
        if (this.factory) {
            return;
        }

        instance.value = new AsyncInstance((async () => {
            const Class = this._Class;
            const asyncInstance = await instance.toPromise();

            for (let key of getAllPropertyNames(Class.prototype)) {
                if (Reflect.getMetadata(constants.postConstruct, asyncInstance, key)) {
                    const components = ClassComponent.getComponentsListFromMethod(Class, key);
                    this.validatePostConstructorParams(components);
                    const asyncParams = container.getDependencyListAsync(components);
                    const params = await Promise.all(asyncParams);
                    (asyncInstance[key] as Function).apply(asyncInstance, params);
                }
            }
            return asyncInstance;
        })());
    }


    isAsync(): boolean {
        return true;
    }
}