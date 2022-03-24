import {ComponentType, Scope} from "./internals";

interface ISettings {
    componentType?: ComponentType;
    scope?: Scope;
}

abstract class NumberDependencyToken extends Number {}
abstract class StringDependencyToken extends String {}
abstract class BooleanDependencyToken extends Boolean {}
abstract class ArrayDependencyToken<T> extends Array<T> {}
abstract class MapDependencyToken<K, V> extends Map<K, V> {}
abstract class SetDependencyToken<T> extends Set<T> {}

export class DependencyToken<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private readonly _scope: Scope;
    private readonly _name: string;
    public static Number: typeof NumberDependencyToken;
    public static String: typeof StringDependencyToken;
    public static Boolean: typeof BooleanDependencyToken;
    public static Array: typeof ArrayDependencyToken;
    public static Map: typeof MapDependencyToken;
    public static Set: typeof SetDependencyToken;

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
DependencyToken.String = Fake as any;
DependencyToken.Boolean = Fake as any;
DependencyToken.Array = Fake as any;
DependencyToken.Map = Fake as any;
DependencyToken.Set = Fake as any;