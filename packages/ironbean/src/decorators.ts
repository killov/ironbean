import "reflect-metadata";
import {
    ApplicationContext,
    Component,
    ComponentType,
    constants,
    createClassDecorator,
    currentContainer,
    Dependency,
    DependencyToken,
    Scope,
    TClass
} from "./internals";

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

export function scope(scope: Scope): ClassDecorator {
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.scope, scope, Class);

        return Class;
    }

    return decorator;
}

export function type<T>(key: DependencyToken<T>|(() => Dependency<T>)) {
    return function(target: any, propertyName: string | symbol, parameterIndex?: number) {
        if (typeof parameterIndex !== "number") {
            Reflect.defineMetadata(constants.types, key, target, propertyName);
        } else {
            const methodParameters: Object[] = Reflect.getOwnMetadata(constants.types, target, propertyName) || [];
            methodParameters[parameterIndex] = key;
            Reflect.defineMetadata(constants.types, methodParameters, target, propertyName);
        }
    }
}

export function lazy(target: any, propertyName: string | symbol, parameterIndex?: number) {
    if (typeof parameterIndex !== "number") {
        Reflect.defineMetadata(constants.lazy, true, target, propertyName);
    } else {
        const methodParameters: Object[] = Reflect.getOwnMetadata(constants.lazy, target, propertyName) || [];
        methodParameters[parameterIndex] = true;
        Reflect.defineMetadata(constants.lazy, methodParameters, target, propertyName);
    }
}

export function postConstruct<T>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}

export function needScope(scope: Scope) {
    return createClassDecorator({
        customContextFactory(context) {
            if (currentContainer === undefined) {
                throw new Error(Component.create(context.Class).name +  " must be initialized via [provideScope] " + scope + ".");
            }
            const container = currentContainer.getParentContainerByScope(scope);
            if (container === undefined) {
                throw new Error(Component.create(context.Class).name + " initialized with different scope provided, please provide scope " + scope + ".");
            }

            return container.getBean(ApplicationContext);
        },
        constructor(context) {
            context.callConstructor()
        }
    });
}
