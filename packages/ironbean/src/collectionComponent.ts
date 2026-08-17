import {AsyncInstance, Component, ComponentContainer, ComponentType, Instance, ScopeImpl} from "./internals";

export class CollectionComponent<T> extends Component<T> {
    private readonly component: Component<T>;
    constructor(component: Component<T>) {
        super();
        this.component = component;
    }

    toCollection(): CollectionComponent<T> {
        return this;
    }

    construct(container: ComponentContainer): Instance<T> {
        const components = this.component.getCollectionComponents();

        if (CollectionComponent.isAnyAsync(components)) {
            const items = Promise.all(container.getDependencyListAsync(components));
            return new Instance(new AsyncInstance(items) as any);
        }

        return new Instance(container.getDependencyList(components) as any);
    }

    isConstructable(): boolean {
        return true;
    }

    hasConstruct(): boolean {
        return true;
    }

    get name(): string {
        return "Collection " + this.component.name;
    }

    getScope(): ScopeImpl|undefined {
        return undefined;
    }

    getType(): ComponentType {
        return ComponentType.Prototype;
    }

    postConstruct(_container: ComponentContainer, _instance: Instance<T>): void {

    }

    setType(_type: ComponentType): void {

    }

    getComponent(): Component {
        return this;
    }

    isComponent(): boolean {
        return true;
    }

    isAsync(): boolean {
        return CollectionComponent.isAnyAsync(this.component.getCollectionComponents());
    }

    private static isAnyAsync(components: Component[]): boolean {
        return components.some((component) => component.isAsync());
    }
}
