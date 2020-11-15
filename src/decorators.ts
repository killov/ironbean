import "reflect-metadata";
import {ComponentType, constants} from "./enums";
import {currentContainer, getBaseContainer} from "./container";
import {Scope} from "./scope";
import {DependencyKey} from "./dependencyKey";

export type Class = new (...args: any[]) => any;
export function component(componentType: ComponentType): any;
export function component(Class: Class): any;
export function component(ClassOrType: Class | ComponentType): any {
    let componentType = ComponentType.Singleton;
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.component, true, Class);
        Reflect.defineMetadata(constants.componentType, componentType, Class);

        return Class;
    }

    // @ts-ignore
    if (ClassOrType.prototype) {
        return decorator(ClassOrType);
    }

    // @ts-ignore
    componentType = ClassOrType;

    return decorator;
}

export function scope(scope: Scope): (Class: Class) => any {
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.scope, scope, Class);

        return Class;
    }

    return decorator;
}

export function autowired<T extends any>(target: T, propertyName: string) {
    const set = () => {};
    const get = function(this: T) {
        const target = this;
        const valueFromCache = Reflect.getMetadata(constants.autowiredCache, this, propertyName)
        if (valueFromCache) {
            return valueFromCache;
        }
        const container = Reflect.getMetadata(constants.container, this) || currentContainer || getBaseContainer();
        const key = Reflect.getMetadata(constants.keys, target, propertyName);
        if (key) {
            const value = container.getByKey(key);
            Reflect.defineMetadata(constants.autowiredCache, value, this, propertyName)
            return value;
        }
        const type = Reflect.getMetadata("design:type", target, propertyName);
        if (!type) {
            throw new Error("type on property " + propertyName + " not found");
        }
        const value = container.getClassInstance(type);
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

export function dependenceKey<T>(key: DependencyKey<T>) {
    return function(target: any, propertyName: string | symbol, parameterIndex?: number) {
        if (parameterIndex === undefined) {
            Reflect.defineMetadata(constants.keys, key, target, propertyName);
        } else {
            const methodParameters: Object[] = Reflect.getOwnMetadata(constants.keys, target, propertyName) || [];
            methodParameters[parameterIndex] = key;
            Reflect.defineMetadata(constants.keys, methodParameters, target, propertyName);
        }
    }
}

export function postConstruct<T>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}