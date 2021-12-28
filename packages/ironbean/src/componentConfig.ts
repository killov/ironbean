import {Component, ComponentFactory, ComponentType, Dependency, Factory} from "./internals";

class Take<TDependency> {
    private readonly takenDependency: Dependency<TDependency>;

    constructor(dependency: Dependency<TDependency>) {
        this.takenDependency = dependency;
    }

    private get takenComponent(): Component {
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
}

export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency> {
    return new Take(dependency);
}
