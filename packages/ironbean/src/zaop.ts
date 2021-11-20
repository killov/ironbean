import {
    ApplicationContext,
    cacheMap,
    ComponentContainer,
    ComponentContext,
    constants,
    Container,
    containerStorage,
    defineProperty,
    Dependency,
    LazyToken,
    markAsOverwrittenDefineProperty,
    plugins,
    TClass
} from "./internals";

interface DecoratorContext {
    componentContext: ComponentContext;
    data: Map<any, any>;
}

interface PropertyDecoratorContext extends DecoratorContext {
    type: Dependency<any>|undefined;
}

abstract class DecoratorContextImpl implements DecoratorContext {
    protected readonly instance: object;

    protected constructor(instance: object) {
        this.instance = instance;
    }

    abstract get data(): Map<any, any>;

    get instanceData(): Map<any, any> {
        let data = Reflect.getOwnMetadata(constants.componentInstanceData, this.instance);
        if (!data) {
            data = new Map<any, any>();
            Reflect.defineMetadata(constants.componentInstanceData, data, this.instance);
        }

        return data;
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

    get data(): Map<any, any> {
        return cacheMap(this.instanceData, this.propertyName, () => new Map<any, any>());
    }

    set value(value: any) {
        defineProperty(this.instance, this.propertyName, {
            value: value
        });
    }

    get value(): any {
        return Object.getOwnPropertyDescriptor(this.instance, this.propertyName)?.value;
    }
}

interface IPropertyDecoratorSettings {
    isConstant?: boolean;
    get?: (context: PropertyDecoratorContext) => void
    set?: (context: PropertyDecoratorContext, value: any) => void
}

export function createPropertyDecorator(settings: IPropertyDecoratorSettings): PropertyDecorator {
    const decorator = function (target: any, propertyName: string|symbol) {
        const set = () => {};
        const get = function(this: any) {
            if (settings.get) {
                const context = new PropertyDecoratorContextImpl(this, propertyName);
                if (context.value) {
                    return context.value;
                }
                const value = settings.get(context);
                if (settings.isConstant) {
                    context.value = value;
                }
                return value;
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
    const isLazy = Reflect.getMetadata(constants.lazy, target, propertyName);

    if (typeof type === "function") {
        type = type();
    }

    if (type) {
        return isLazy ? LazyToken.create(type) : type;
    }

    const fromMetaData = Reflect.getMetadata("design:type", target, propertyName);

    if (fromMetaData === Object || fromMetaData === undefined) {
        throw new Error("Property " + propertyName.toString() + " of class " + target.constructor.name + " failed to determine type.");
    }

    return isLazy ? LazyToken.create(fromMetaData) : fromMetaData;
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

    return Reflect.getMetadata(constants.componentContainer, target) || containerStorage.currentComponentContainer || createAndSetComponentContainer(target);
}

function createAndSetComponentContainer(target: any) {
    const componentContainer = new ComponentContainer(containerStorage.getBaseContainer());
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
    private readonly propertyName: string|symbol;
    public readonly args: any[];

    constructor(instance: object, propertyName: string|symbol, method: () => any, args: any) {
        super(instance);
        this.propertyName = propertyName;
        this.method = method;
        this.args = args;
    }

    callMethod(): any {
        return this.method();
    }

    get data(): Map<any, any> {
        return cacheMap(this.instanceData, this.propertyName, () => new Map<any, any>());
    }
}

export function createMethodDecorator(settings: IMethodDecoratorSettings): MethodDecorator {
    const decorator = function (target: any, propertyName: string|symbol, descriptor: TypedPropertyDescriptor<any>) {
        const call = descriptor.value;
        descriptor.value = function(this: any, ...args: any[]) {
            if (settings.call) {
                return settings.call(new MethodDecoratorContextImpl(this, propertyName, () => call.apply(this, args), args))
            }
            return target[propertyName];
        };
    }
    return decorator;
}

interface IClassDecoratorSettings {
    customContextFactory?: (context: ClassDecoratorContext) => ApplicationContext;
    constructor?: (context: ClassDecoratorContext) => void;
}

interface ClassDecoratorContext extends DecoratorContext {
    Class: TClass<any>;
    args: any[];
    callConstructor(): any;
}

class ClassDecoratorContextImpl extends DecoratorContextImpl implements ClassDecoratorContext {
    private static DATA = Symbol();
    public Class: TClass<any>;
    public args: any[];

    constructor(instance: any, Class: TClass<any>, args: any[]) {
        super(instance);
        this.Class = Class;
        this.args = args;
    }

    callConstructor(): any {
        return containerStorage.currentComponentContainerAction(
            this.componentContainer,
            () => this.Class.apply(this.instance, this.args)
        );
    }

    get componentContainer(): ComponentContainer {
        return this.componentContext.getBean(ComponentContainer);
    }

    get data(): Map<any, any> {
        return cacheMap(this.instanceData, ClassDecoratorContextImpl.DATA, () => new Map<any, any>());
    }
}

export function createClassDecorator(settings: IClassDecoratorSettings) {
    return function (Class: any) {
        if (settings.constructor) {
            const constructor = settings.constructor;
            const extended = function (this: any, ...args: any[]) {
                let customContainer;
                const context = new ClassDecoratorContextImpl(this, Class, args);
                if (settings.customContextFactory) {
                    customContainer = settings.customContextFactory(context).getBean(Container);
                }
                const componentContainer = new ComponentContainer(customContainer ?? containerStorage.currentContainer ?? containerStorage.getBaseContainer());
                Reflect.defineMetadata(constants.componentContainer, componentContainer, this);
                constructor(context);
            }

            Object.setPrototypeOf(extended, Class);
            extended.prototype = Class.prototype;
            extended.prototype.constructor = extended;

            return extended;
        }
        return Class;
    }
}
