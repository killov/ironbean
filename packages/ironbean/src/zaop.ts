import {
    ApplicationContext,
    CollectionToken,
    Component,
    ComponentContainer,
    ComponentContext,
    constants,
    Container,
    containerStorage,
    defineProperty,
    Dependency,
    LazyToken,
    markAsOverwrittenDefineProperty,
    TClass
} from "./internals";

interface DecoratorContext {
    isComponent: boolean;
    componentContext: ComponentContext;
}

interface PropertyDecoratorContext extends DecoratorContext {
    type: Dependency<any>|undefined;
}

abstract class DecoratorContextImpl implements DecoratorContext {
    protected readonly instance: object;
    private component: Component;

    protected constructor(component: Component, instance: object) {
        this.component = component;
        this.instance = instance;
    }

    get isComponent(): boolean {
        return this.component.isComponent();
    }

    get componentContext (): ComponentContext {
        return getComponentContextFromInstance(this.instance);
    }
}

class PropertyDecoratorContextImpl extends DecoratorContextImpl implements PropertyDecoratorContext {
    private readonly propertyName: string | symbol;

    constructor(component: Component, instance: object, propertyName: string|symbol) {
        super(component, instance);
        this.propertyName = propertyName;
    }

    get type(): Dependency<any>|undefined {
        return resolveType(this.instance, this.propertyName);
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
    isConstant?: boolean|((context: PropertyDecoratorContext) => void);
    get?: (context: PropertyDecoratorContext) => void
    set?: (context: PropertyDecoratorContext, value: any) => void
}

export function createPropertyDecorator(settings: IPropertyDecoratorSettings): PropertyDecorator {
    const decorator: PropertyDecorator = function (target: any, propertyName: string|symbol) {
        const targetComponent = Component.create(target.constructor);
        const set = () => {};
        const get = function(this: any) {
            if (settings.get) {
                const context = new PropertyDecoratorContextImpl(targetComponent, this, propertyName);
                const value = settings.get(context);
                if (settings.isConstant) {
                    if (settings.isConstant === true || (typeof settings.isConstant === "function" && settings.isConstant(context))) {
                        context.value = value;
                    }
                }
                return value;
            }
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
    const isCollection = Reflect.getMetadata(constants.collection, target, propertyName);

    if (typeof type === "function") {
        type = type();
    }

    if (type) {
        type = isLazy ? LazyToken.create(type) : type;
        return isCollection ? CollectionToken.create(type) : type;
    }

    const fromMetaData = Reflect.getMetadata("design:type", target, propertyName);

    if (fromMetaData === Object || fromMetaData === undefined) {
        throw new Error("Property " + propertyName.toString() + " of class " + target.constructor.name + " failed to determine type.");
    }

    return isLazy ? LazyToken.create(fromMetaData) : fromMetaData;
}

function getComponentContextFromInstance(target: object): ComponentContext {
    for (let plugin of containerStorage.plugins) {
        if (plugin.getContextForClassInstance) {
            const context = plugin.getContextForClassInstance(target);
            if (context) {
                return context;
            }
        }
    }

    return getComponentContainerFromInstance(target).getBean(ComponentContext);
}

function getComponentContainerFromInstance(target: object): ComponentContainer {
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

    constructor(component: Component, instance: object, propertyName: string|symbol, method: () => any, args: any) {
        super(component, instance);
        this.propertyName = propertyName;
        this.method = method;
        this.args = args;
    }

    callMethod(): any {
        return this.method();
    }
}

export function createMethodDecorator(settings: IMethodDecoratorSettings): MethodDecorator {
    const decorator: MethodDecorator = function (target: any, propertyName: string|symbol, descriptor: TypedPropertyDescriptor<any>) {
        const call = descriptor.value;
        descriptor.value = function(this: any, ...args: any[]) {
            if (settings.call) {
                return settings.call(new MethodDecoratorContextImpl(Component.create(target), this, propertyName, () => call.apply(this, args), args))
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

    constructor(component: Component, instance: any, Class: TClass<any>, args: any[]) {
        super(component, instance);
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
}

export function createClassDecorator(settings: IClassDecoratorSettings) {
    return function (Class: any) {
        if (settings.constructor) {
            const constructor = settings.constructor;
            const extended = function (this: any, ...args: any[]) {
                let customContainer;
                const context = new ClassDecoratorContextImpl(Component.create(Class), this, Class, args);
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
