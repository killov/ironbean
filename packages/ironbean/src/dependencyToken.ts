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
    readonly isAsync: boolean = false;
    public static Number: typeof NumberDependencyToken;
    public static String: typeof StringDependencyToken;
    public static Boolean: typeof BooleanDependencyToken;
    public static Array: typeof ArrayDependencyToken;
    public static Map: typeof MapDependencyToken;
    public static Set: typeof SetDependencyToken;

    protected constructor(name: string, componentType: ComponentType, scope: Scope) {
        this._name = name;
        this._scope = scope;
        this._componentType = componentType;
    }

    public static create<TDependency>(name: string, settings: ISettings = {}) {
        return new DependencyToken<TDependency>(name, settings.componentType || ComponentType.Singleton, settings.scope || Scope.getDefault());
    }

    public static createAsync<TDependency>(name: string, settings: ISettings = {}): AsyncDependencyToken<TDependency> {
        return this.create(name, settings) as any as AsyncDependencyToken<TDependency>;
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

export class AsyncDependencyToken<TDependency> extends DependencyToken<TDependency> {
    // @ts-ignore
    g: TDependency;
}

// @ts-ignore
export abstract class Fake extends DependencyToken<any> {
    constructor() {
        // @ts-ignore
        super();
        throw new Error("Dependency token is not for create instance over new.");
    }
}

function createFake(type: any): any {
    // @ts-ignore
    return class extends Fake {
        static type = type;
    }
}

DependencyToken.Number = createFake(Number);
DependencyToken.String = createFake(String);
DependencyToken.Boolean = createFake(Boolean);
DependencyToken.Array = createFake(Array);
DependencyToken.Map = createFake(Map);
DependencyToken.Set = createFake(Set);