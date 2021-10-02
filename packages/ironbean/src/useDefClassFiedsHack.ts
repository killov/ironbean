const propOverridesSymbol = Symbol()
const origDefineProperty = Object.defineProperty;
Object.defineProperty = function(o: any, p: string | number | symbol, attributes: PropertyDescriptor & ThisType<any>): any {
    if (!isOverwritten(o, p)) {
        return origDefineProperty(o, p, attributes);
    } else {
        // just set value
        o[p] = attributes.value;
        return o;
    }
}

function isOverwritten(o: any, p: string | number | symbol): boolean {
    const set = o[propOverridesSymbol];
    if (set) {
        return set.has(p) || isOverwritten(Object.getPrototypeOf(o), p)
    }
    return false;
}

export function markAsOverwrittenDefineProperty(o: any, p: string | number | symbol) {
    if (!o[propOverridesSymbol] || !o.hasOwnProperty(propOverridesSymbol)) {
        // should be a hidden prop instead in a final implementation
        o[propOverridesSymbol] = new Set();
    }
    o[propOverridesSymbol].add(p);
}