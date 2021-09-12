import {
    ComponentContainer,
    ComponentContext,
    constants,
    currentComponentContainer, plugins,
    Dependency, getBaseContainer,
    markAsOverwrittenDefineProperty
} from "./internals";

interface DecoratorContext {
    componentContext: ComponentContext;
}

interface PropertyDecoratorContext extends DecoratorContext {
    type: Dependency<any>|undefined;
}

abstract class DecoratorContextImpl implements DecoratorContext {
    protected readonly instance: object;

    constructor(instance: object) {
        this.instance = instance;
    }

    get componentContext (): ComponentContext {
        const container = getComponentContainerFromInstance(this.instance);
        return container.getBean(ComponentContext);
    }
}

class PropertyDecoratorContextImpl extends DecoratorContextImpl implements PropertyDecoratorContext {
    private readonly propertyName: string | symbol;

    constructor(instance: object, propertyName: string|symbol) {
        super(instance);
        this.propertyName = propertyName;
    }

    get type(): Dependency<any>|undefined {
        return resolveType(this.instance, this.propertyName);
    }
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
                const context = new PropertyDecoratorContextImpl(this, propertyName);
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
            markAsOverwrittenDefineProperty(target, propertyName);
        }
    }

    return decorator;
}

function resolveType(target: any, propertyName: string|symbol) {
    let type = Reflect.getMetadata(constants.types, target, propertyName);

    if (typeof type === "function") {
        type = type();
    }

    if (type) {
        return type;
    }

    const fromMetaData = Reflect.getMetadata("design:type", target, propertyName);

    if (fromMetaData === Object) {
        throw new Error("Property " + propertyName.toString() + " of class " + target.constructor.name + " failed to determine type.");
    }

    return fromMetaData;
}

function getComponentContainerFromInstance(target: object): ComponentContainer {
    for (let decorator of plugins) {
        if (decorator.getComponentContainerForClassInstance) {
            const container = decorator.getComponentContainerForClassInstance(target);
            if (container) {
                return container;
            }
        }
    }

    return Reflect.getMetadata(constants.componentContainer, target) || currentComponentContainer || createAndSetComponentContainer(target);
}

function createAndSetComponentContainer(target: any) {
    const componentContainer = new ComponentContainer(getBaseContainer());
    Reflect.defineMetadata(constants.componentContainer, componentContainer, target);
    return componentContainer;
}

interface IMethodDecoratorSettings {
    call?: (context: MethodDecoratorContext) => void
}

interface MethodDecoratorContext extends DecoratorContext {
    callMethod(): any;
    args: any[];
}

class MethodDecoratorContextImpl extends DecoratorContextImpl implements MethodDecoratorContext {
    private readonly method: () => any;
    public readonly args: any[];

    constructor(instance: object, method: () => any, args: any) {
        super(instance);
        this.method = method;
        this.args = args;
    }

    callMethod(): any {
        return this.method();
    }
}

export function createMethodDecorator(settings: IMethodDecoratorSettings): MethodDecorator {
    const decorator = function (target: any, propertyName: string|symbol, descriptor: TypedPropertyDescriptor<any>) {
        const call = descriptor.value;
        descriptor.value = function(this: any, ...args: any[]) {
            if (settings.call) {
                return settings.call(new MethodDecoratorContextImpl(this, () => call.apply(this, args), args))
            }
            return target[propertyName];
        };
    }
    return decorator;
}
