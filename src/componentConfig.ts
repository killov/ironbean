import {DependencyToken} from "./dependencyToken";
import {Component} from "./component";

export interface ComponentConfig<T> {
    add<TDependency extends T>(Class: new (...any: any[]) => TDependency): ComponentConfig<T>;
    add<TDependency extends T>(objectKey: DependencyToken<TDependency>): ComponentConfig<T>;
}

export function getComponentConfig<TDependency>(component: (new (...any: any[]) => TDependency)|DependencyToken<TDependency>): ComponentConfig<TDependency> {
    return Component.create(component as any);
}