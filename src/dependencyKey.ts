import {ComponentType} from "./enums";
import {getDefaultScope, Scope} from "./scope";

interface ISettings {
    componentType?: ComponentType;
    scope?: Scope;
}

export class DependencyKey<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private _scope: Scope;
    private factory?: () => TDependency;

    private constructor(componentType: ComponentType, scope: Scope) {
        this._scope = scope;
        this._componentType = componentType;
    }

    public static create<TDependency>(settings: ISettings = {}) {
        return new DependencyKey<TDependency>(settings.componentType || ComponentType.Singleton, settings.scope || getDefaultScope());
    }

    public setFactory(factory: () => TDependency): void {
        this.factory = factory;
    }

    public getFactory(): () => TDependency {
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