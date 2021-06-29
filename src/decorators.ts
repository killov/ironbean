import "reflect-metadata";
import {ComponentType, constants, DependencyToken, Scope, TClass} from "./internals";

export type Class = TClass<any>;
export function component(componentType: ComponentType): ClassDecorator;
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

export function type<T>(key: DependencyToken<T>|(() => TClass<T>)) {
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