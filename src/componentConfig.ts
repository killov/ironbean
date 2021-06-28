import {Component, ComponentContext, DependencyToken, TClass} from "./internals";

export type Dependency<TDependency> = TClass<TDependency>|DependencyToken<TDependency>;
export type ComponentFactory<TDependency> = (componentContext: ComponentContext) => TDependency

class Take<TDependency> {
    private readonly takenDependency: Dependency<TDependency>;

    constructor(dd: Dependency<TDependency>) {
        this.takenDependency = dd;
    }

    private get takenComponent(): Component {
        return Component.create(this.takenDependency);
    }

    public bindTo<T extends TDependency>(dependency: Dependency<T>): void {
        this.takenComponent.add(Component.create(dependency))
    }

    public setFactory(factory: ComponentFactory<TDependency>): void {
        let dependencyToken = this.takenDependency;

        if (this.takenComponent.isClass()) {
            dependencyToken = DependencyToken.create<TDependency>(this.takenComponent.name);
            this.bindTo(dependencyToken);
        }
        Component.create(dependencyToken).setFactory(factory);
    }
}

export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency> {
    return new Take(dependency);
}