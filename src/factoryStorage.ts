import {component} from "./decorators";

@component
export class FactoryStorage {
    factories: Map<object, Function> = new Map<object, Function>();

    saveFactory(key: Object, factory: Function) {
        this.factories.set(key, factory);
    }

    getFactory(key: Object): Function|undefined {
        return this.factories.get(key);
    }
}
