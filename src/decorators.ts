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
    const set = () => {};
    const get = function(this: any) {
        const target = this;
        const valueFromCache = Reflect.getMetadata(constants.autowiredCache, this, propertyName)
        if (valueFromCache) {
            return valueFromCache;
        }
        const type = Reflect.getMetadata("design:type", target, propertyName);
        if (!type) {
            throw new Error("type not found");
        }
        const container = getBaseContainer();
        const value = container.getDependency(type);
        Reflect.defineMetadata(constants.autowiredCache, value, this, propertyName)
        return value;
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