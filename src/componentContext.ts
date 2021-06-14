import {ComponentType, ComponentContainer, DependencyToken, component, TClass} from "./internals";

@component(ComponentType.Prototype)
export class ComponentContext {
    private container: ComponentContainer;

    constructor(container: ComponentContainer) {
        this.container = container;
    }

    public getBean<T>(Class: TClass<T>): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.container.getBean(dependencyKey);
    }
}