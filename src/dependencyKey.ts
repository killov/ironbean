import {ComponentType} from "./enums";
import {getDefaultScope, Scope} from "./scope";
import {ComponentContext} from "./base";

interface ISettings {
    componentType?: ComponentType;
    scope?: Scope;
}

type ComponentFactory<TDependency> = (componentContext: ComponentContext) => TDependency

export class DependencyKey<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private _scope: Scope;
    private factory?: ComponentFactory<TDependency>;

    private constructor(componentType: ComponentType, scope: Scope) {
        this._scope = scope;
        this._componentType = componentType;
    }

    public static create<TDependency>(settings: ISettings = {}) {
        return new DependencyKey<TDependency>(settings.componentType || ComponentType.Singleton, settings.scope || getDefaultScope());
    }

    public setFactory(factory: ComponentFactory<TDependency>): void {
        this.factory = factory;
    }

    public getFactory(): ComponentFactory<TDependency> {
        if (!this.factory) {
            throw new Error("Factory for " + this + "not found.");
        }
        return this.factory;
    }

    get componentType(): ComponentType {
        return this._componentType;
    }

    get scope(): Scope {
        return this._scope;
    }
}