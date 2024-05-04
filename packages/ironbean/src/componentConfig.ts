import {
    Async,
    AsyncDependency, AsyncDependencyToken,
    AsyncFactory,
    Component,
    ComponentAsyncFactory,
    ComponentFactory,
    ComponentType,
    Dependency, DependencyToken,
    Factory,
    TClass
} from "./internals";

class Take<TDependency> {
    private readonly takenDependency: Dependency<TDependency>;

    constructor(dependency: Dependency<TDependency>) {
        this.takenDependency = dependency;
    }

    protected get takenComponent(): Component {
        return Component.create(this.takenDependency);
    }

    public bindTo<T extends TDependency>(dependency: Dependency<T>): void {
        this.takenComponent.add(Component.create(dependency))
    }

    public setFactory(factory: ComponentFactory<TDependency>): void {
        this.takenComponent.setFactory(Factory.create(factory));
    }

    public setType(componentType: ComponentType): void {
        this.takenComponent.setType(componentType);
    }

    public setClassType<T extends TDependency>(classType: TClass<T>): void {
        this.takenComponent.setClassType(classType);
    }

    public clear(): void {
        this.takenComponent.clear();
    }
}

class AsyncTake<TDependency> extends Take<TDependency> {

    public bindTo<T extends TDependency>(dependency: Dependency<T>|AsyncDependency<T>): void {
        this.takenComponent.add(Component.create(dependency))
    }

    public setAsyncFactory(factory: ComponentAsyncFactory<TDependency>): void {
        this.takenComponent.setFactory(AsyncFactory.create(factory));
    }
}

export function take<TDependency>(dependency: AsyncDependency<TDependency>): AsyncTake<TDependency>
export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency>
export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency> {
    if ((dependency as any).prototype instanceof Async || dependency instanceof AsyncDependencyToken) {
        // @ts-ignore
        return new AsyncTake(dependency as AsyncDependency<TDependency>);
    }
    return new Take(dependency);
}
