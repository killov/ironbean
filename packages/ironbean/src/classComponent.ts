import {
    Component,
    ComponentContainer,
    ComponentType,
    constants,
    Container,
    getAllPropertyNames,
    Instance,
    isContext,
    Scope,
    ScopeImpl,
    TClass,
} from "./internals";

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

    public getScope(): ScopeImpl|undefined {
        if (this.isApplicationContext()) {
            return undefined;
        }
        return Reflect.getMetadata(constants.scope, this._Class) ?? Scope.getDefault();
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
        const collection = Reflect.getOwnMetadata(constants.collection, this._Class) as any[] ?? [];
        const components = ClassComponent.getComponents(Classes, objectKeys, lazy, collection);

        this.validateConstructorParams(components);

        return components;
    }

    public construct(container: ComponentContainer): Instance<T> {
        if (this.factory) {
            return this.factory.construct(container);
        }

        const params = container.getDependencyList(this.getConstructDependencyList());
        const instance = new this._Class(...params);
        Reflect.defineMetadata(constants.componentContainer, container, instance);

        return new Instance(instance);
    }

    private static getComponents(types: any[], key: any[], lazy: any[], collection: any[]): Component[] {
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
            if (collection[index]) {
                component = component!.toCollection();
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

    public postConstruct(container: ComponentContainer, instance: Instance<any>) {
        if (this.factory) {
            return;
        }
        const Class = this._Class;

        for (let key of getAllPropertyNames(Class.prototype)) {
            if (Reflect.getMetadata(constants.postConstruct, instance.value, key)) {
                (instance.value[key] as Function).apply(instance.value, ClassComponent.getDependencyListFromMethod(Class, key, container));
            }
        }
    }

    public static getDependencyListFromMethod<T>(Class: TClass<T>, propertyName: string, container: ComponentContainer) {
        let Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, propertyName) as any[] || [];
        const objectKeys = Reflect.getOwnMetadata(constants.types, Class.prototype, propertyName) ?? [];
        const lazy = Reflect.getOwnMetadata(constants.lazy, Class.prototype, propertyName) ?? [];
        const collection = Reflect.getOwnMetadata(constants.collection, Class.prototype, propertyName) ?? [];
        Classes = ClassComponent.getComponents(Classes, objectKeys, lazy, collection);

        return container.getDependencyList(Classes);
    }

    private isApplicationContext(): boolean {
        const Class = this._Class;

        // @ts-ignore
        return isContext(Class) || Container.isContainer(Class);
    }

    isConstructable(): boolean {
        return this.hasConstruct();
    }

    hasConstruct(): boolean {
        return this.isComponent() || this.factory !== undefined;
    }

    isComponent(): boolean {
        return Reflect.getOwnMetadata(constants.component, this._Class) === true;
    }

    get name(): string {
        return "Class " + this._Class.name;
    }
}