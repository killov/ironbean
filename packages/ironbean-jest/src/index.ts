import {component, DependencyToken, getBaseTestingContext, take, TestingContext} from "ironbean";
import {TestProvider} from "ironbean/dist/api";
import {Dependency} from "ironbean/dist/internalsTesting";
import MockInstance = jest.MockInstance;

@component
class JestTestProvider extends TestProvider {
    public mockClass<T>(Class: { new(): T }): T {
        const methods: string[] = [];
        const properties: string[] = [];
        for (const key of getAllPropertyNames(Class.prototype)) {
            if (typeof Object.getOwnPropertyDescriptor(Class.prototype, key)?.get === "function") {
                properties.push(key);
            } else {
                methods.push(key);
            }
        }
        return this.createSpyObj<T>("", methods, properties) as any;
    }

    public mockUnknown<T>(_dep: DependencyToken<T>): T {
        return new Proxy<any>({}, {
            get(_target: T, p: PropertyKey) {
                return (_target as any)[p] = (_target as any)[p] ?? jest.fn();
            },
            set(target: T, p: string | symbol, value: any): boolean {
                (target as any)[p] = value;
                return true;
            }
        }) as any;
    }

    private createSpyObj<T>(_baseName: string, methodNames: string[], properties: string[]): SpyObject<T> {
        let obj: any = {};

        for (let i = 0; i < methodNames.length; i++) {
            obj[methodNames[i]] = jest.fn();
        }

        for (let i = 0; i < properties.length; i++) {
            const descriptor = {
                enumerable: true,
                get: jest.fn(),
                set: jest.fn()
            };
            Object.defineProperty(obj, properties[i], descriptor);
        }

        return obj;
    };
}

take(TestProvider).bindTo(JestTestProvider);

function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}

export abstract class JestTestingContext extends TestingContext {
    abstract getMock<T>(dependency: Dependency<T>): SpyObject<T>;
}

export function getBaseJasmineTestingContext(): JestTestingContext {
    return getBaseTestingContext() as JestTestingContext;
}

export type SpyObject<T> = T &
    {
        [K in keyof T]: T[K] extends (...A: infer Y) => infer R ? MockInstance<R, Y> : never;
    };

type DataPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type DataPropertiesOnly<T> = {
    [P in DataPropertyNames<T>]: T[P] extends object ? DataPropertiesOnly<T[P]> : T[P]
};

interface IPropertyDescriptor<TReturn> {
    get: MockInstance<TReturn, []>
    set: MockInstance<void, [TReturn]>;
}

export function getPropertyDescriptor<
    T extends object,
    TProperty extends keyof DataPropertiesOnly<T>
    >(object: SpyObject<T>, property: TProperty): IPropertyDescriptor<T[TProperty]> {
    const descriptor = Object.getOwnPropertyDescriptor(object, property);

    if (!descriptor) {
        throw new Error("property" + " is not property");
    }
    // @ts-ignore
    return descriptor;
}
