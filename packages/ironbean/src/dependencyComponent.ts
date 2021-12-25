import {Component, ComponentContainer, ComponentType, DependencyToken, ScopeImpl} from "./internals";

export class DependencyComponent<T> extends Component<T> {
    public readonly key: DependencyToken<T>

    public static create<T>(key: DependencyToken<T>): DependencyComponent<T> {
        return new DependencyComponent<T>(key);
    }

    private constructor(key: DependencyToken<T>) {
        super();
        this.key = key;
    }

    public getScope(): ScopeImpl {
        return this.key.scope as ScopeImpl;
    }

    public getType(): ComponentType {
        return this.key.componentType;
    }

    public setType(componentType: ComponentType): void {
        this.key.componentType = componentType;
    }

    public construct(container: ComponentContainer, ..._params: any[]): T {
         if (!this.factory) {
            throw new Error("Factory for " + this.name + " not found.");
        }

        return this.factory.construct(container)
    }


    public postConstruct(_container: ComponentContainer, _instance: any) {

    }

    isConstructable(): boolean {
        return true;
    }

    get name(): string {
        return this.key.name;
    }

    isComponent(): boolean {
        return true;
    }
}
