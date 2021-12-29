import {Component, ComponentContainer, ComponentType, ScopeImpl} from "./internals";

export class CollectionComponent<T> extends Component<T> {
    private readonly component: Component<T>;
    constructor(component: Component<T>) {
        super();
        this.component = component;
    }

    toCollection(): CollectionComponent<T> {
        return this;
    }

    construct(container: ComponentContainer): T {
        return container.getDependencyList(this.component.getCollectionComponents()) as any;
    }

    isConstructable(): boolean {
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

    postConstruct(_container: ComponentContainer, _instance: T): void {

    }

    setType(_type: ComponentType): void {

    }

    getComponent(): Component {
        return this;
    }

    isComponent(): boolean {
        return true;
    }
}