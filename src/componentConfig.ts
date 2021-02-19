import {DependencyToken} from "./dependencyToken";
import {Component} from "./component";

type Dependency<TDependency> = (new (...any: any[]) => TDependency)|DependencyToken<TDependency>;

class Take<TDependency> {
    private readonly takenDependency: Dependency<TDependency>;

    constructor(dd: Dependency<TDependency>) {
        this.takenDependency = dd;
    }

    public to<T extends TDependency>(dependency: Dependency<T>): void {
        Component.create(this.takenDependency).add(Component.create(dependency))
    }
}

export function take<TDependency>(dependency: Dependency<TDependency>): Take<TDependency> {
    return new Take(dependency);
}