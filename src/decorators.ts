import "reflect-metadata";
import {
    ComponentContainer,
    ComponentType,
    constants,
    currentComponentContainer, DependencyToken,
    getBaseContainer, markAsOverridenDefineProperty,
    Scope
} from "./internals";

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

function createAndSetComponentContainer(target: any) {
    const componentContainer = new ComponentContainer(getBaseContainer());
    Reflect.defineMetadata(constants.componentContainer, componentContainer, target);
    return componentContainer;
}

export function autowired(target: any, propertyName: string) {
    const set = () => {};
    const get = function(this: any) {
        const target = this;
        const container = Reflect.getMetadata(constants.componentContainer, target) || currentComponentContainer || createAndSetComponentContainer(target);
        const type = Reflect.getMetadata(constants.types, target, propertyName)
            || Reflect.getMetadata("design:type", target, propertyName);

        return container.getBean(type);
    };

    if (delete target[propertyName]) {
        Object.defineProperty(target, propertyName, {
            get: get,
            set: set,
            enumerable: true,
            configurable: true
        });
        markAsOverridenDefineProperty(target, propertyName);
    }
}

export function type<T>(key: DependencyToken<T>) {
    return function(target: any, propertyName: string | symbol, parameterIndex?: number) {
        if (parameterIndex === undefined) {
            Reflect.defineMetadata(constants.types, key, target, propertyName);
        } else {
            const methodParameters: Object[] = Reflect.getOwnMetadata(constants.types, target, propertyName) || [];
            methodParameters[parameterIndex] = key;
            Reflect.defineMetadata(constants.types, methodParameters, target, propertyName);
        }
    }
}

export function postConstruct<T>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}