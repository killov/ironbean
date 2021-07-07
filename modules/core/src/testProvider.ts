import {component, getAllPropertyNames, TClass} from "./internals";

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

}