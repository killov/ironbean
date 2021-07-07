import {
    ComponentContainer,
    ComponentContext,
    constants,
    currentComponentContainer,
    Dependency, getBaseContainer,
    markAsOverridenDefineProperty
} from "./internals";

class PropertyDecoratorContext {
    type?: Dependency<any>
    componentContext!: ComponentContext;
}

interface IPropertyDecoratorSettings {
    get?: (context: PropertyDecoratorContext) => void
    set?: (context: PropertyDecoratorContext, value: any) => void
}

export function createPropertyDecorator(settings: IPropertyDecoratorSettings): PropertyDecorator {
    const decorator = function (target: any, propertyName: string|symbol) {
        const set = () => {};
        const get = function(this: any) {
            if (settings.get) {
                const target = this;
                const container = getComponentContainerFromInstance(target);
                const context = new PropertyDecoratorContext();
                context.type = resolveType(target, propertyName);
                context.componentContext = container.getBean(ComponentContext);
                return settings.get(context);
            }
            return target[propertyName];
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

    return decorator;
}

function resolveType(target: any, propertyName: string|symbol) {
    let type = Reflect.getMetadata(constants.types, target, propertyName);

    if (typeof type === "function") {
        type = type();
    }

    return type || Reflect.getMetadata("design:type", target, propertyName);
}

function getComponentContainerFromInstance(target: any): ComponentContainer {
    return Reflect.getMetadata(constants.componentContainer, target) || currentComponentContainer || createAndSetComponentContainer(target)
}

function createAndSetComponentContainer(target: any) {
    const componentContainer = new ComponentContainer(getBaseContainer());
    Reflect.defineMetadata(constants.componentContainer, componentContainer, target);
    return componentContainer;
}