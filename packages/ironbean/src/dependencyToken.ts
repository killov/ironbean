import {ComponentType, Scope, TClass} from "./internals";

interface ISettings {
    componentType?: ComponentType;
    scope?: Scope;
}

class NumberDependencyToken extends Number {}

export class DependencyToken<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private readonly _scope: Scope;
    private readonly _name: string;
    public static Number: TClass<NumberDependencyToken>;

    private constructor(name: string, componentType: ComponentType, scope: Scope) {
        this._name = name;
        this._scope = scope;
        this._componentType = componentType;
    }

    public static create<TDependency>(name: string, settings: ISettings = {}) {
        return new DependencyToken<TDependency>(name, settings.componentType || ComponentType.Singleton, settings.scope || Scope.getDefault());
    }

    get componentType(): ComponentType {
        return this._componentType;
    }

    set componentType(value: ComponentType) {
        this._componentType = value;
    }

    get scope(): Scope {
        return this._scope;
    }

    get name(): string {
        return this._name;
    }
}

// @ts-ignore
abstract class Fake extends DependencyToken {

}

DependencyToken.Number = Fake as any;