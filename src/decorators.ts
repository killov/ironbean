import "reflect-metadata";
import {ComponentType, constants} from "./enums";
import {getBaseContainer} from "./container";


export function component(ClassOrType: any): any {
    let componentType = ComponentType.Singleton;
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.component, true, Class);
        Reflect.defineMetadata(constants.componentType, componentType, Class);

        return Class;
    }

    if (ClassOrType.prototype) {
        return decorator(ClassOrType);
    }

    componentType = ClassOrType;

    return decorator;
}

export function autowired<T extends any>(target: T, propertyName: string) {
    let _value: any;
    const set = () => {};
    const get = () => {
        if (_value) {
            return _value;
        }
        const type = Reflect.getMetadata("design:type", target, propertyName);
        if (!type) {
            throw new Error("type not found");
        }
        const container = getBaseContainer();
        _value = container.getDependency(type);
        return _value;
    };

    if (delete target[propertyName]) {
        Object.defineProperty(target, propertyName, {
            get: get,
            set: set,
            enumerable: true,
            configurable: true
        });
    }
}

export function postConstruct<T>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}