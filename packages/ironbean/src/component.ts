import {
    ApplicationContext,
    ComponentContainer,
    ComponentContext,
    ComponentFactory,
    ComponentType,
    constants,
    Container,
    createLazy,
    DependencyToken,
    getAllPropertyNames,
    getDefaultScope,
    IFactory,
    LazyToken,
    ScopeImpl,
    TClass,
    TestContainer,
    TestingContext
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

        const component = object.prototype ? ClassComponent.create<T>(object) : DependencyComponent.create<T>(object);
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

    abstract get name(): string;
}

export class ClassComponent<T> extends Component<T> {
    private readonly _Class: TClass<T>;

    get Class(): TClass<T> {
        return this._Class;
    }

    public static create<T>(Class: TClass<T>): ClassComponent<T> {
        return new ClassComponent<T>(Class);
    }

    private constructor(Class: TClass<T>) {
        super();
        this._Class = Class;
    }

    public isUnknownType(): boolean {
        return (this.Class as any) === Object;
    }

    public getScope(): ScopeImpl {
        return Reflect.getMetadata(constants.scope, this._Class) ?? getDefaultScope();
    }

    public getType(): ComponentType {
        return Reflect.getMetadata(constants.componentType, this._Class) ?? ComponentType.Prototype;
    }

    public setType(componentType: ComponentType): void {
        Reflect.defineMetadata(constants.componentType, componentType, this._Class);
    }

    private getConstructDependencyList(): Component[] {
        const Classes = Reflect.getOwnMetadata("design:paramtypes", this._Class) as any[] || [];
        const objectKeys = Reflect.getOwnMetadata(constants.types, this._Class) as any[] ?? [];
        const lazy = Reflect.getOwnMetadata(constants.lazy, this._Class) as any[] ?? [];
        const components = ClassComponent.getComponents(Classes, objectKeys, lazy);

        this.validateConstructorParams(components);

        return components;
    }

    public construct(container: ComponentContainer): T {
        if (this.factory) {
            return this.factory.construct(container);
        }

        const params = container.getDependencyList(this.getConstructDependencyList());
        const instance = new this._Class(...params);
        Reflect.defineMetadata(constants.componentContainer, container, instance);

        return instance;
    }

    private static getComponents(types: any[], key: any[], lazy: any[]): Component[] {
        return types.map((Class, index) => {
            let component: Component;
            if (Class) {
                component = Component.create(Class);
            }
            if (key[index]) {
                const obj = key[index];
                component = typeof obj === "function" ? Component.create(obj()) : Component.create(obj)
            }
            if (lazy[index]) {
                component = component!.toLazy();
            }

            return component! as Component;
        });
    }

    private validateConstructorParams(components: Component[]) {
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (component.isUnknownType()) {
                throw new Error("The parameter at index " + i + " of constructor " + this.name + " could recognize the type.");
            }
        }
    }

    public postConstruct(container: ComponentContainer, instance: any) {
        const Class = this._Class;

        for (let key of getAllPropertyNames(Class.prototype)) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                (instance[key] as Function).apply(instance, ClassComponent.getDependencyListFromMethod(Class, key, container));
            }
        }
    }

    public static getDependencyListFromMethod<T>(Class: TClass<T>, propertyName: string, container: ComponentContainer) {
        let Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, propertyName) as any[] || [];
        const objectKeys = Reflect.getOwnMetadata(constants.types, Class.prototype, propertyName) ?? [];
        const lazy = Reflect.getOwnMetadata(constants.lazy, Class.prototype, propertyName) ?? [];
        Classes = ClassComponent.getComponents(Classes, objectKeys, lazy);

        return container.getDependencyList(Classes);
    }

    public isApplicationContext(): boolean {
        const Class = this._Class;

        // @ts-ignore
        return Class === ApplicationContext || Class === TestingContext || Class === Container || Class === TestContainer;
    }

    isConstructable(): boolean {
        return Reflect.getOwnMetadata(constants.component, this._Class) === true || this.factory !== undefined;
    }

    get name(): string {
        return "Class " + this._Class.name;
    }
}

export class DependencyComponent<T> extends Component<T> {
    private readonly key: DependencyToken<T>

    public static create<T>(key: DependencyToken<T>): DependencyComponent<T> {
        return new DependencyComponent<T>(key);
    }

    private constructor(key: DependencyToken<T>) {
        super();
        this.key = key;
    }

    public getScope(): ScopeImpl {
        return this.key.scope as ScopeImpl;
    }

    public getType(): ComponentType {
        return this.key.componentType;
    }

    public setType(componentType: ComponentType): void {
        this.key.componentType = componentType;
    }

    public construct(container: ComponentContainer, ..._params: any[]): T {
         if (!this.factory) {
            throw new Error("Factory for " + this.name + " not found.");
        }

        return this.factory.construct(container)
    }


    public postConstruct(_container: ComponentContainer, _instance: any) {

    }

    isConstructable(): boolean {
        return true;
    }

    get name(): string {
        return this.key.name;
    }
}

export class LazyComponent<T> extends Component<T> {
    private component: Component<T>;
    constructor(component: Component<T>) {
        super();
        this.component = component;
    }

    construct(container: ComponentContainer): T {
        return createLazy(() => container.getComponentInstance(this.component) as any);
    }

    isConstructable(): boolean {
        return this.component.isConstructable();
    }

    get name(): string {
        return "Lazy " + this.component.name;
    }

    getScope(): ScopeImpl {
        return this.component.getScope();
    }

    getType(): ComponentType {
        return this.component.getType();
    }

    postConstruct(_container: ComponentContainer, _instance: T): void {
        this.component.postConstruct(_container, _instance);
    }

    setType(type: ComponentType): void {
        this.component.setType(type);
    }

    toLazy(): LazyComponent<T> {
        return this;
    }

    getComponent(): Component {
        return this.component.getComponent().toLazy();
    }
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
        return this.factoryConstruct(container);
    }

    private isFactoryClass(func: any): func is TClass<IFactory<T>> {
        return typeof func === 'function'
            && func.prototype.create !== undefined;
    }

    protected factoryConstruct(container: ComponentContainer) {
        if (this.isFactoryClass(this.factory)) {
            const factoryClass = this.factory;
            const factory = container.getBean(factoryClass);
            const args = ClassComponent.getDependencyListFromMethod(factoryClass, "create", container);

            return factory.create.apply(factory, args);
        }

        return this.factory(container.getBean(ComponentContext));
    }

    isConstructable(): boolean {
        return true;
    }

    name = "";
}
