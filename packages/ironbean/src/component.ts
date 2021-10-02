import {
    ApplicationContext,
    ComponentContainer,
    ComponentContext,
    ComponentFactory,
    ComponentType,
    constants,
    Container,
    DependencyToken,
    getAllPropertyNames,
    getDefaultScope,
    IFactory,
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

export abstract class Component<T = any> implements IConstructable<T> {
    components: Component[] = [];
    protected factory?: Factory<T>;

    public static create<T>(Class: any): Component<T> {
        if (Class.prototype) {
            return ClassComponent.create<T>(Class);
        } else {
            return DependencyComponent.create<T>(Class);
        }
    }

    abstract getScope(): ScopeImpl;

    abstract getType(): ComponentType;

    abstract setType(type: ComponentType): void;

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
    private static map: Map<object, ClassComponent<any>> = new Map<object, ClassComponent<any>>();
    private readonly _Class: TClass<T>;

    get Class(): TClass<T> {
        return this._Class;
    }

    public static create<T>(Class: TClass<T>): ClassComponent<T> {
        if (!this.map.has(Class)) {
            this.map.set(Class, new ClassComponent<T>(Class));
        }

        return this.map.get(Class) as ClassComponent<T>;
    }

    private constructor(Class: TClass<T>) {
        super();
        this._Class = Class;
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
        const objectKeys = Reflect.getOwnMetadata(constants.types, this._Class) as any[]

        return ClassComponent.getComponents(Classes, objectKeys);
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

    private static getComponents(types: any[], key: any[]): Component[] {
        const map: (Component|undefined)[] = types.map(Class => Class ? Component.create(Class) : undefined);

        if (key) {
            key.forEach((obj, index) => {
                if (obj) {
                    if (typeof obj === "function") {
                        map[index] = Component.create(obj())
                    } else {
                        map[index] = Component.create(obj)
                    }
                }
            })
        }

        return map as Component[];
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
        const objectKeys = Reflect.getOwnMetadata(constants.types, Class.prototype, propertyName);
        Classes = ClassComponent.getComponents(Classes, objectKeys);

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
    private static map: Map<object, DependencyComponent<any>> = new Map<object, DependencyComponent<any>>();
    private readonly key: DependencyToken<T>

    public static create<T>(key: DependencyToken<T>): DependencyComponent<T> {
        if (!this.map.has(key)) {
            this.map.set(key, new DependencyComponent<T>(key));
        }

        return this.map.get(key) as DependencyComponent<T>;
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