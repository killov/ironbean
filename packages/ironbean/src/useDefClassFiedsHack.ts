const propOverridesSymbol = Symbol()
export const defineProperty = Object.defineProperty;
Object.defineProperty = function(o: any, p: string | number | symbol, attributes: PropertyDescriptor & ThisType<any>): any {
    if (!isOverwritten(o, p)) {
        return defineProperty(o, p, attributes);
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

// Native class fields (target ES2022+ with useDefineForClassFields: true) are defined
// via [[DefineOwnProperty]] directly by the engine - the patched Object.defineProperty
// above is bypassed and the own property shadows the decorator accessor on the prototype.
// There is no way to intercept that, so fail loudly instead of returning undefined.
export function checkShadowedProps(instance: any): void {
    let current = Object.getPrototypeOf(instance);
    while (current) {
        if (current.hasOwnProperty(propOverridesSymbol)) {
            const set: Set<string | number | symbol> = current[propOverridesSymbol];
            set.forEach(p => {
                const own = Object.getOwnPropertyDescriptor(instance, p);
                // native field init creates {value, writable: true, enumerable: true, configurable: true},
                // cached constant from the accessor creates non-writable prop - must not match
                if (own !== undefined && own.writable === true && own.enumerable === true && own.configurable === true) {
                    throw new Error("Property " + p.toString() + " of class " + instance.constructor.name
                        + " is shadowed by class field, @autowired does not work for code compiled with useDefineForClassFields: true, use inject.lazy() instead.");
                }
            });
        }
        current = Object.getPrototypeOf(current);
    }
}