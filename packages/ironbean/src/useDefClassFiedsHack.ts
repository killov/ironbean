// Shared across bundled copies so marks are visible between bundle layers.
const propOverridesSymbol = Symbol.for("ironbean.useDefineForClassFields.propertyOverrides");
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

export function getOverriddenProps(prototype: any): Set<string | number | symbol> {
    const result = new Set<string | number | symbol>();
    let current = prototype;
    while (current) {
        const set: Set<string | number | symbol> | undefined = current[propOverridesSymbol];
        if (set) {
            set.forEach(p => result.add(p));
        }
        current = Object.getPrototypeOf(current);
    }
    return result;
}

// Re-install marked prototype accessors on the instance after construction, for
// targets where the field initializer shadows them with an own property.
export function installInstanceAccessors(instance: any, ClassProto: any): void {
    if (!ClassProto) return;
    const marks = getOverriddenProps(ClassProto);
    if (marks.size === 0) return;
    marks.forEach(propName => {
        try {
            let proto = ClassProto;
            let protoDescriptor: PropertyDescriptor | undefined = undefined;
            while (proto) {
                protoDescriptor = Object.getOwnPropertyDescriptor(proto, propName);
                if (protoDescriptor && protoDescriptor.get) break;
                protoDescriptor = undefined;
                proto = Object.getPrototypeOf(proto);
            }
            if (!protoDescriptor) return;
            const existing = Object.getOwnPropertyDescriptor(instance, propName);
            if (existing) {
                if (!existing.configurable) return;
                delete instance[propName];
            }
            defineProperty(instance, propName, protoDescriptor);
        } catch (e) {}
    });
}