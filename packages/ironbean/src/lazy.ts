export function createLazy<T extends object>(create: () => T): T {
    return new Proxy<T>({} as any, new LazyProxyHandler<T>(create));
}

class LazyProxyHandler<T extends object> implements ProxyHandler<T>{
    private readonly create: () => T;
    private _instance: T|undefined;
    constructor(create: () => T) {
        this.create = create;
    }

    private get instance(): T {
        return this._instance = this._instance ?? this.create();
    }

    get(_target: T, p: PropertyKey) {
        return (this.instance as any)[p];
    }

    set(_target: T, p: PropertyKey, value: any): boolean {
        (this.instance as any)[p] = value;
        return true;
    }
}
