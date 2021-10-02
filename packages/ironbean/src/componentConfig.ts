import {Component, ComponentContext, ComponentType, DependencyToken, Factory, IFactory, TClass} from "./internals";

export type Dependency<TDependency> = TClass<TDependency>|DependencyToken<TDependency>;
export type FunctionFactory<TDependency> = (componentContext: ComponentContext) => TDependency;
export type ComponentFactory<TDependency> = FunctionFactory<TDependency>|TClass<IFactory<TDependency>>;

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