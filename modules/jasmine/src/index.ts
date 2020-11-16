import {TestingContext} from "fire-dic";
import {getTestContainer} from "fire-dic/dist/container";
import {TestProvider} from "fire-dic/dist/testProvider";
import Spy = jasmine.Spy;
import SpyObj = jasmine.SpyObj;

class JasmineTestProvider extends TestProvider {
    public mockClass<T>(Class: { new(): T }): T {
        const methods = [];
        const properties = [];
        for (const key in Class.prototype) {
            if (typeof Object.getOwnPropertyDescriptor(Class.prototype, key)?.get === "function") {
                properties.push(key);
            } else {
                methods.push(key);
            }
        }
        return jasmine.createSpyObj(methods, properties);
    }
}

export class JasmineTestingContext extends TestingContext {
    public getMock<T>(Class: new (...any: any[]) => T): jasmine.SpyObj<T> {
        return super.getMock(Class) as jasmine.SpyObj<T>;
    }
}

export function getBaseJasmineTestingContext(): JasmineTestingContext {
    const container = getTestContainer();
    container.setTestProvider(new JasmineTestProvider());
    return container.getClassInstance(TestingContext as any) as JasmineTestingContext;
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