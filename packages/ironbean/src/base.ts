import {
    Component,
    component,
    ComponentType,
    Container,
    containerStorage,
    Dependency,
    Scope,
    ScopeImpl,
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

    public provideScope<T>(action: () => T) {
        return containerStorage.currentContainerAction(this.container, action);
    }

    public createOrGetParentContext(scope: Scope): ApplicationContext {
        const container = this.container.getContainerForScope(scope as ScopeImpl);
        return container.getBean(ApplicationContext);
    }
}

export function getRootAppContext(): ApplicationContext {
    const container = containerStorage.getBaseContainer();
    return container.getBean(ApplicationContext);
}

export function destroyContext(): void {
    containerStorage.destroyContainer();
}

export const ApplicationContextComponent = Component.create(ApplicationContext);
