import {DependencyKey} from "./dependencyKey";
import {Component} from "./component";

export interface ComponentConfig<T> {
    add<TDependency extends T>(Class: new (...any: any[]) => TDependency): ComponentConfig<T>;
    add<TDependency extends T>(objectKey: DependencyKey<TDependency>): ComponentConfig<T>;
}

export function getComponentConfig<TDependency>(component: (new (...any: any[]) => TDependency)|DependencyKey<TDependency>): ComponentConfig<TDependency> {
    return Component.create(component as any);
}