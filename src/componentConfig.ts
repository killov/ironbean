import {Component, ComponentContext, DependencyToken} from "./internals";

type Dependency<TDependency> = (new (...any: any[]) => TDependency)|DependencyToken<TDependency>;
export type ComponentFactory<TDependency> = (componentContext: ComponentContext) => TDependency

class Take<TDependency> {
    private readonly takenDependency: Dependency<TDependency>;

    constructor(dd: Dependency<TDependency>) {
        this.takenDependency = dd;
    }

    public bindTo<T extends TDependency>(dependency: Dependency<T>): void {
        Component.create(this.takenDependency).add(Component.create(dependency))
    }

    public setFactory(factory: ComponentFactory<TDependency>): void {
        const dependency = this.takenDependency;
        let dependencyToken = dependency;
        // @ts-ignore
        if (dependency.prototype) {
            dependencyToken = DependencyToken.create<TDependency>();
            this.bindTo(dependencyToken);
        }
        Component.create(dependencyToken).setFactory(factory);
    }
}

export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency> {
    return new Take(dependency);
}