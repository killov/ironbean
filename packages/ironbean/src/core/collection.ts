import {Dependency} from "./internals";

export class CollectionToken<TDependency = any> {
    dependency: Dependency<TDependency>;

    private constructor(dependency: Dependency<TDependency>) {
        this.dependency = dependency;
    }

    public static create<TDependency>(dependency: Dependency<TDependency>): CollectionToken<TDependency> {
        return dependency instanceof CollectionToken
            ? dependency as CollectionToken
            : new CollectionToken(dependency);
    }
}
