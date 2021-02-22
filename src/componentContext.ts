import {ComponentType, ComponentContainer, DependencyToken, component} from "./internals";

@component(ComponentType.Prototype)
export class ComponentContext {
    private container: ComponentContainer;

    constructor(container: ComponentContainer) {
        this.container = container;
    }

    public getBean<T>(Class: new (...any: any[]) => T): T;
    public getBean<TDependency>(objectKey: DependencyToken<TDependency>): TDependency;
    public getBean<T>(dependencyKey: any): T {
        return this.container.getBean(dependencyKey);
    }
}