import "reflect-metadata";
import {
    ApplicationContext, ClassComponent,
    Component,
    ComponentType,
    constants,
    containerStorage,
    createClassDecorator,
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
        const component = Component.create(Class) as ClassComponent<any>
        component.setType(componentType);
        component.setIsComponent(true);

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
        (Component.create(Class) as ClassComponent<any>).setScope(scope)

        return Class;
    }

    return decorator;
}

export function type<T>(key: DependencyToken<T>|(() => Dependency<T>)) {
    return function(target: any, propertyName?: string | symbol, parameterIndex?: number) {
        if (typeof parameterIndex !== "number") {
            if (propertyName !== undefined) {
                Reflect.defineMetadata(constants.types, key, target, propertyName);
            } else {
                Reflect.defineMetadata(constants.types, key, target);
            }
        } else {
            if (propertyName !== undefined) {
                const methodParameters: Object[] = Reflect.getOwnMetadata(constants.types, target, propertyName) || [];
                methodParameters[parameterIndex] = key;
                Reflect.defineMetadata(constants.types, methodParameters, target, propertyName);
            } else {
                const methodParameters: Object[] = Reflect.getOwnMetadata(constants.types, target) || [];
                methodParameters[parameterIndex] = key;
                Reflect.defineMetadata(constants.types, methodParameters, target);
            }
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

export function collection(target: any, propertyName: string | symbol, parameterIndex?: number) {
    if (typeof parameterIndex !== "number") {
        Reflect.defineMetadata(constants.collection, true, target, propertyName);
    } else {
        const methodParameters: Object[] = Reflect.getOwnMetadata(constants.collection, target, propertyName) || [];
        methodParameters[parameterIndex] = true;
        Reflect.defineMetadata(constants.collection, methodParameters, target, propertyName);
    }
}

export function postConstruct<T extends Object>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}

export function needScope(scope: Scope) {
    return createClassDecorator({
        customContextFactory(Class) {
            if (containerStorage.currentContainer === undefined) {
                throw new Error(Component.create(Class).name +  " must be initialized via [provideScope] " + scope + ".");
            }
            const container = containerStorage.currentContainer.getParentContainerByScope(scope);
            if (container === undefined) {
                throw new Error(Component.create(Class).name + " initialized with different scope provided, please provide scope " + scope + ".");
            }

            return container.getBean(ApplicationContext);
        },
        constructor(context) {
            return context.callConstructor();
        }
    });
}
