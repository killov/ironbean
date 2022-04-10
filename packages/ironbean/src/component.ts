import {
    ClassComponent,
    CollectionComponent,
    CollectionToken,
    ComponentContainer,
    ComponentContext,
    ComponentFactory,
    ComponentType,
    constants,
    Dependency,
    DependencyComponent,
    DependencyToken,
    IFactory,
    Instance,
    LazyComponent,
    LazyToken,
    ScopeImpl,
    TClass
} from "./internals";

export interface IConstructable<T> {
    construct(container: ComponentContainer): Instance<T>;
    isConstructable(): boolean;
    name: string;
}

const component$ = Symbol();

export abstract class Component<T = any> implements IConstructable<T> {
    components: Component[] = [];
    protected factory?: Factory<T>;
    private lazy: LazyComponent<T>|undefined;
    private collection: CollectionComponent<T>|undefined;
    private classType: TClass<T>|undefined;

    public static create<T>(object: Dependency<T>): Component<T> {
        if (Reflect.hasOwnMetadata(component$, object)) {
            return Reflect.getOwnMetadata(component$, object);
        }

        const component = this.createComponentForToken(object);
        Reflect.defineMetadata(component$, component, object)

        return component;
    }

    private static createComponentForToken<T>(object: Dependency<T>): Component {
        if (object instanceof LazyToken) {
            return Component.create<T>(object.dependency).toLazy();
        }

        if (object instanceof CollectionToken) {
            return Component.create<T>(object.dependency).toCollection();
        }

        if (typeof object === "function" && object.prototype instanceof DependencyToken) {
            return DependencyComponent.create(DependencyToken.create(object.name));
        }

        return object instanceof DependencyToken ? DependencyComponent.create<T>(object) : ClassComponent.create<T>(object);
    }

    public toLazy(): LazyComponent<T> {
        return this.lazy = this.lazy ?? new LazyComponent(this);
    }

    public toCollection(): CollectionComponent<T> {
        return this.collection = this.collection ?? new CollectionComponent(this);
    }

    abstract getScope(): ScopeImpl|undefined;

    abstract getType(): ComponentType;

    abstract setType(type: ComponentType): void;

    public setClassType<TT extends T>(classType: TClass<TT>) {
        this.classType = classType;
    }

    public getClassType(): TClass<T>|undefined {
        return this.classType;
    }

    public isUnknownType(): boolean {
        return false;
    }

    abstract construct(container: ComponentContainer): Instance<T>;

    abstract postConstruct(_container: ComponentContainer, _instance: Instance<T>): void;

    public setFactory(factory: Factory<T>): void {
        this.factory = factory;
    }

    public clear() {
        this.factory = undefined;
        this.components = [];
    }

    public getComponent(): Component {
        const last = this.components[this.components.length - 1];
        return last ? last.getComponent() : this;
    }

    public getCollectionComponents(): Component[] {
        if (this.components.length === 0) {
            return this.hasConstruct() ? [this] : [];
        }

        return this.components;
    }

    add(cmp: Component): any {
        this.components.push(cmp);
        return this;
    }

    abstract isConstructable(): boolean;

    abstract hasConstruct(): boolean;

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

    public construct(container: ComponentContainer): Instance<T> {
        const instance = this.constructInstance(container);
        if (instance instanceof Object) {
            Reflect.defineMetadata(constants.componentContainer, container, instance);
        }

        return new Instance(instance);
    }

    private constructInstance(container: ComponentContainer): T {
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

    isAsync(): boolean {
        return false;
    }

    name = "";
}
