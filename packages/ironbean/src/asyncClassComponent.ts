import {
    Async,
    AsyncInstance,
    ClassComponent,
    ComponentContainer,
    constants,
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
            const params = await Promise.all(asyncParams)
            const instance = new Class(...params);
            // @ts-ignore
            Reflect.defineMetadata(constants.componentContainer, container, instance);
            return instance;
        }

        return new Instance(new AsyncInstance(promiseFactory()) as any);
    }


    isAsync(): boolean {
        return true;
    }
}