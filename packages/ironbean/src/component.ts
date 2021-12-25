import {
    ClassComponent,
    ComponentContainer,
    ComponentContext,
    ComponentFactory,
    ComponentType,
    DependencyComponent,
    DependencyToken,
    IFactory,
    LazyComponent,
    LazyToken,
    ScopeImpl,
    TClass
} from "./internals";

export interface IConstructable<T> {
    construct(container: ComponentContainer): T;
    isConstructable(): boolean;
    name: string;
}

const component$ = Symbol();

export abstract class Component<T = any> implements IConstructable<T> {
    components: Component[] = [];
    protected factory?: Factory<T>;
    private lazy: LazyComponent<T>|undefined;

    public static create<T>(object: any): Component<T> {
        if (Reflect.hasOwnMetadata(component$, object)) {
            return Reflect.getOwnMetadata(component$, object);
        }

        if (object instanceof LazyToken) {
            return Component.create<T>(object.dependency).toLazy();
        }

        const component = object instanceof DependencyToken ? DependencyComponent.create<T>(object as any) : ClassComponent.create<T>(object);
        Reflect.defineMetadata(component$, component, object)

        return component;
    }

    public toLazy(): LazyComponent<T> {
        return this.lazy = this.lazy ?? new LazyComponent(this);
    }

    abstract getScope(): ScopeImpl;

    abstract getType(): ComponentType;

    abstract setType(type: ComponentType): void;

    public isUnknownType(): boolean {
        return false;
    }

    abstract construct(container: ComponentContainer): T;

    abstract postConstruct(_container: ComponentContainer, _instance: T): void;

    public setFactory(factory: Factory<T>): void {
        this.factory = factory;
    }

    public isApplicationContext(): boolean {
        return false;
    }

    public getComponent(): Component {
        const last = this.components[this.components.length - 1];
        return last ? last.getComponent() : this;
    }

    add(cmp: Component): any {
        this.components.push(cmp);
        return this;
    }

    abstract isConstructable(): boolean;

    abstract isComponent(): boolean;

    abstract get name(): string;
}

export class Factory<T> implements IConstructable<T> {
    protected factory: ComponentFactory<T>;

    public static create<T>(factory: ComponentFactory<T>): Factory<T> {
        return new Factory<T>(factory);
    }

    private constructor(factory: ComponentFactory<T>) {
        this.factory = factory
    }

    public construct(container: ComponentContainer): T {
        if (this.isFactoryClass(this.factory)) {
            const factoryClass = this.factory;
            const factory = container.getBean(factoryClass);
            const args = ClassComponent.getDependencyListFromMethod(factoryClass, "create", container);

            return factory.create.apply(factory, args);
        }

        return this.factory(container.getBean(ComponentContext));
    }

    private isFactoryClass(func: any): func is TClass<IFactory<T>> {
        return typeof func === 'function'
            && func.prototype.create !== undefined;
    }

    isConstructable(): boolean {
        return true;
    }

    name = "";
}
