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