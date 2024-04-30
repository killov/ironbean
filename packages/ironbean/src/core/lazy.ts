import {Dependency} from "./internals";

export function createLazy<T extends object>(create: () => T): T {
    return new Proxy<T>({} as any, new LazyProxyHandler<T>(create));
}

class LazyProxyHandler<T extends object> implements ProxyHandler<T>{
    private readonly create: () => T;
    private _instance: T|undefined;
    private methodMap: {[k: string|symbol]: Function } = {};
    constructor(create: () => T) {
        this.create = create;
    }

    private get instance(): T {
        return this._instance = this._instance ?? this.create();
    }

    get(_target: T, p: PropertyKey) {
        const instance = this.instance;
        const value = (instance as any)[p] as any;
        if (typeof value === 'function') {
            return this.methodMap[p] = this.methodMap[p] ?? value.bind(instance);
        }
        return value;
    }

    set(_target: T, p: PropertyKey, value: any): boolean {
        (this.instance as any)[p] = value;
        return true;
    }
}

export class LazyToken<TDependency = any> {
    dependency: Dependency<TDependency>;

    private constructor(dependency: Dependency<TDependency>) {
        this.dependency = dependency;
    }

    public static create<TDependency>(dependency: Dependency<TDependency>): LazyToken<TDependency> {
        return dependency instanceof LazyToken
            ? dependency as LazyToken
            : new LazyToken(dependency);
    }
}
