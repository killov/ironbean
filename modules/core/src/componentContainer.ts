import {
    Component,
    component,
    ComponentContext,
    ComponentType,
    Container,
    Dependency,
    DependencyStorage
} from "./internals";

@component(ComponentType.Singleton)
export class ComponentContainer {
    private container: Container;
    protected readonly storage: DependencyStorage = new DependencyStorage();

    constructor(container: Container) {
        this.container = container;
        this.storage.saveInstance(Component.create<ComponentContainer>(ComponentContainer), this);
        this.storage.saveInstance(Component.create(ComponentContext), new ComponentContext(this));
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component))
    }

    public getBean<TDependency>(dependency: Dependency<TDependency>): TDependency {
        return this.getComponentInstance(Component.create(dependency));
    }

    public getComponentInstance<T>(component: Component<T>): T {
        component = this.container.getComponent(component);
        let instance: T|undefined = this.storage.getInstance(component);

        if (instance === undefined) {
            instance = this.container.getComponentInstance(component);
            this.storage.saveInstance(component, instance);
        }

        return instance;
    }
}