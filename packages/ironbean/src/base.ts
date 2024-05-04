import {
    Component,
    component,
    ComponentType,
    Container,
    containerStorage,
    Dependency,
    Scope,
    ScopeImpl,
    StorageMode,
    TClass
} from "./internals";

export function isContext(Class: TClass<any>) {
    // @ts-ignore
    return Class["$context"] === ApplicationContext.$context;
}

@component(ComponentType.Singleton)
export class ApplicationContext {
    // @ts-ignore
    private static $context = Symbol("context");
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.container.getBean(dependency);
    }

    public getBeanAsync<T>(dependency: Dependency<T>): Promise<T> {
        return this.container.getBeanAsync(dependency);
    }

    public provideScope<T>(action: () => T) {
        return containerStorage.currentContainerAction(this.container, action);
    }

    public createOrGetParentContext(scope: Scope): ApplicationContext {
        const container = this.container.getContainerForScope(scope as ScopeImpl);
        return container.getBean(ApplicationContext);
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    if (containerStorage.mode === StorageMode.Prototype) {
        throw new Error("You use createBaseApplicationContext(), don't use it in combination with getBaseApplicationContext() in the same environment.")
    }
    containerStorage.mode = StorageMode.Singleton;
    const container = containerStorage.getOrCreateBaseContainer();
    return container.getBean(ApplicationContext);
}

export function createBaseApplicationContext(): ApplicationContext {
    if (containerStorage.mode === StorageMode.Singleton) {
        throw new Error("You use getBaseApplicationContext(), don't use it in combination with createBaseApplicationContext() in the same environment.")
    }
    containerStorage.mode = StorageMode.Prototype;
    const container = containerStorage.createBaseContainer();

    return container.getBean(ApplicationContext);
}

export function destroyContext(): void {
    containerStorage.destroyContainer();
}

export const ApplicationContextComponent = Component.create(ApplicationContext);
