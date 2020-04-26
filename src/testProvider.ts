export abstract class TestProvider {

    public abstract mockClass<T>(Class: new () => T): T;

}

export class JasmineTestProvider extends TestProvider {
    public mockClass<T>(Class: { new(): T }): T {
        const methods = [];
        for (const key in Class.prototype) {
            methods.push(key);
        }
        return jasmine.createSpyObj(methods);
    }
}