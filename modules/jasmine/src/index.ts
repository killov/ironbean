import {component, getBaseTestingContext, take, TestingContext} from "ironbean";
import {TestProvider} from "ironbean/dist/api";
import Spy = jasmine.Spy;
import SpyObj = jasmine.SpyObj;

@component
class JasmineTestProvider extends TestProvider {
    public mockClass<T>(Class: { new(): T }): T {
        const methods = [];
        const properties = [];
        for (const key of getAllPropertyNames(Class.prototype)) {
            if (typeof Object.getOwnPropertyDescriptor(Class.prototype, key)?.get === "function") {
                properties.push(key);
            } else {
                methods.push(key);
            }
        }
        return jasmine.createSpyObj(methods, properties);
    }
}

take(TestProvider).bindTo(JasmineTestProvider);

function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}

export abstract class JasmineTestingContext extends TestingContext {
    abstract getMock<T>(Class: new (...any: any[]) => T): jasmine.SpyObj<T>;
}

export function getBaseJasmineTestingContext(): JasmineTestingContext {
    return getBaseTestingContext() as JasmineTestingContext;
}

type DataPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type DataPropertiesOnly<T> = {
    [P in DataPropertyNames<T>]: T[P] extends object ? DataPropertiesOnly<T[P]> : T[P]
};

interface IPropertyDescriptor<TReturn> {
    get: Spy<() => TReturn>
    set: Spy<(value: TReturn) => void>;
}

export function getPropertyDescriptor<
        T extends object,
        TProperty extends keyof DataPropertiesOnly<T>,
        TReturn = T[TProperty]
    >(object: SpyObj<T>, property: TProperty): IPropertyDescriptor<TReturn> {
    const descriptor = Object.getOwnPropertyDescriptor(object, property);

    if (!descriptor) {
        throw new Error(property + " is not property");
    }
    // @ts-ignore
    return descriptor;
}
