import {
    Component,
    component,
    ComponentContext,
    ComponentType,
    Container,
    Dependency,
    DependencyStorage,
    Instance
} from "./internals";

@component(ComponentType.Singleton)
export class ComponentContainer {
    private container: Container;
    protected readonly storage: DependencyStorage = new DependencyStorage();

    constructor(container: Container) {
        this.container = container;
        this.storage.saveInstance(Component.create<ComponentContainer>(ComponentContainer), new Instance(this));
        this.storage.saveInstance(Component.create(ComponentContext), new Instance(new ComponentContext(this)));
    }

    public getDependencyList(components: Component[]) {
        return components.map((component) => this.getComponentInstance(component).value)
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.getComponentInstance(Component.create(dependency)).value;
    }

    public getComponentInstance<T>(component: Component<T>): Instance<T> {
        component = this.container.getComponent(component);
        let instance: Instance<T>|undefined = this.storage.getInstance(component);

        if (instance === undefined) {
            instance = this.container.getComponentInstance(component);
            this.storage.saveInstance(component, instance);
        }

        return instance;
    }
}
