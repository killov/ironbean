export class TestProvider {

    public mockClass<T>(Class: { new(): T }): T {
        const obj: any = {};
        for (const key in Class.prototype) {
            obj[key] = function () {

            }
        }
        return obj as T;
    }

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