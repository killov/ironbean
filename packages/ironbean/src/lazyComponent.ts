import {Component, ComponentContainer, ComponentType, createLazy, ScopeImpl} from "./internals";

export class LazyComponent<T> extends Component<T> {
    private readonly component: Component<T>;
    constructor(component: Component<T>) {
        super();
        this.component = component;
    }

    construct(container: ComponentContainer): T {
        return createLazy(() => container.getComponentInstance(this.component) as any);
    }

    isConstructable(): boolean {
        return this.component.isConstructable();
    }

    get name(): string {
        return "Lazy " + this.component.name;
    }

    getScope(): ScopeImpl|undefined {
        return this.component.getScope();
    }

    getType(): ComponentType {
        return this.component.getType();
    }

    postConstruct(_container: ComponentContainer, _instance: T): void {
        this.component.postConstruct(_container, _instance);
    }

    setType(type: ComponentType): void {
        this.component.setType(type);
    }

    toLazy(): LazyComponent<T> {
        return this;
    }

    getComponent(): Component {
        return this.component.getComponent().toLazy();
    }

    public getCollectionComponents(): Component[] {
        return this.component.getCollectionComponents().map(component => component.toLazy());
    }

    isComponent(): boolean {
        return this.component.isComponent();
    }
}