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
    ScopeImpl, TClass,
    TestContainer,
    TestingContext
} from "./internals";

export abstract class Component<T = any> {
    components: Component[] = [];
    protected factory?: ComponentFactory<T>;

    public static create<T>(Class: any): Component<T> {
        if (Class.prototype) {
            return ClassComponent.create(Class);
        } else {
            return DependencyComponent.create(Class);
        }
    }

    abstract getScope(): ScopeImpl;

    abstract getType(): ComponentType;

    abstract setType(type: ComponentType): void;

    abstract getConstructDependencyList(): Component[];

    abstract construct(_container: ComponentContainer, ..._params: any[]): T;

    abstract postConstruct(_container: ComponentContainer, _instance: T): void;

    public setFactory(factory: ComponentFactory<T>): void {
        this.factory = factory;
    }

    protected factoryConstruct(_container: ComponentContainer) {
        return this.factory!(_container.getBean(ComponentContext));
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

    collectComponents(components: Component[] = []) {
        components.push(this);
        components.push(...this.components);
        this.components.forEach(c => c.collectComponents(components));

        return components;
    }

    public isClass(): boolean {
        return false;
    }

    abstract isInjectable(): boolean;

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

    public getConstructDependencyList(): Component[] {
        const Classes = Reflect.getOwnMetadata("design:paramtypes", this._Class) as any[] || [];
        const objectKeys = Reflect.getOwnMetadata(constants.types, this._Class) as any[]

        return ClassComponent.getComponents(Classes, objectKeys);
    }

    public construct(_container: ComponentContainer, ..._params: any[]): T {
        if (this.factory) {
            return this.factoryConstruct(_container)
        }

        return new this._Class(..._params);
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
                let Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key) as any[] || [];
                const objectKeys = Reflect.getOwnMetadata(constants.types, Class.prototype, key);
                Classes = ClassComponent.getComponents(Classes, objectKeys);
                (instance[key] as Function).apply(instance, container.getDependencyList(Classes));
            }
        }
    }

    public isApplicationContext(): boolean {
        const Class = this._Class;

        // @ts-ignore
        return Class === ApplicationContext || Class === TestingContext || Class === Container || Class === TestContainer;
    }

    isInjectable(): boolean {
        return Reflect.getMetadata(constants.component, this._Class) === true || this.factory !== undefined;
    }

    get name(): string {
        return "Class " + this._Class.name;
    }

    public isClass(): boolean {
        return true;
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

    public getConstructDependencyList(): Component[] {
        return [];
    }

    public construct(_container: ComponentContainer, ..._params: any[]): T {
         if (!this.factory) {
            throw new Error("Factory for " + this.name + " not found.");
        }

        return this.factoryConstruct(_container);
    }


    public postConstruct(_container: ComponentContainer, _instance: any) {

    }

    isInjectable(): boolean {
        return true;
    }

    get name(): string {
        return this.key.name;
    }
}