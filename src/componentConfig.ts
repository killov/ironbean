import {DependencyKey} from "./dependencyKey";
import {ClassComponent, DependencyComponent} from "./component";

export interface ComponentConfig<T> {
    add<TDependency extends T>(Class: new (...any: any[]) => TDependency): ComponentConfig<T>;
    add<TDependency extends T>(objectKey: DependencyKey<TDependency>): ComponentConfig<T>;
}

export function getComponentConfig<TDependency>(component: (new (...any: any[]) => TDependency)|DependencyKey<TDependency>): ComponentConfig<TDependency> {
    // @ts-ignore
    if (component.prototype) {
        return ClassComponent.create(component as any);
    } else {
        return DependencyComponent.create(component as any);
    }
}