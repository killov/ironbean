import {component, DependencyToken, getAllPropertyNames, TClass} from "./internalsTesting";

@component
export class TestProvider {
    public mockClass<T>(Class: TClass<T>): T {
        const obj: any = {};
        for (const key of getAllPropertyNames(Class.prototype)) {
            obj[key] = function () {

            }
        }
        return obj as T;
    }

    public mockPrimitive(type: any): any {
        switch (type) {
            case Number:
                return 1;
            case String:
                return "string";
            case Boolean:
                return true;
            case Array:
                return [];
            case Map:
                return new Map();
            case Set:
                return new Set();
            default:
                return undefined;
        }
    }

    public mockUnknown<T>(_dep: DependencyToken<T>): T {
        return new Proxy<any>({}, {
            get(_target: T, p: PropertyKey) {
                return (_target as any)[p] ?? function () {};
            },
            set(target: T, p: string | symbol, value: any): boolean {
                (target as any)[p] = value;
                return true;
            }
        }) as any;
     }

}