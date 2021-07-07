const propOverridesSymbol = Symbol()
const origDefineProperty = Object.defineProperty;
Object.defineProperty = function(o: any, p: string | number | symbol, attributes: PropertyDescriptor & ThisType<any>): any {
    const overriden =isOverriten(o, p); // will get it from prototype if available
    if (!overriden) {
        return origDefineProperty(o, p, attributes);
    } else {
        // just set value
        o[p] = attributes.value;
        return o;
    }
}

function isOverriten(o: any, p: string | number | symbol): boolean {
    const set = o[propOverridesSymbol];
    if (set) {
        return set.has(p) || isOverriten(Object.getPrototypeOf(o), p)
    }
    return false;
}

export function markAsOverridenDefineProperty(o: any, p: string | number | symbol) {
    if (!o[propOverridesSymbol] || !o.hasOwnProperty(propOverridesSymbol)) {
        // should be a hidden prop instead in a final implementation
        o[propOverridesSymbol] = new Set();
    }
    o[propOverridesSymbol].add(p);
}