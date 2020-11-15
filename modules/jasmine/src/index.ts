import {TestingContext} from "fire-dic";
import {getTestContainer} from "fire-dic/dist/container";
import {TestProvider} from "fire-dic/dist/testProvider";

class JasmineTestProvider extends TestProvider {
    public mockClass<T>(Class: { new(): T }): T {
        const methods = [];
        const properties = [];
        for (const key in Class.prototype) {
            if (typeof Object.getOwnPropertyDescriptor(Class.prototype, name)?.get === "function") {
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