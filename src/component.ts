import {getDefaultScope, ScopeImpl} from "./scope";
import {ComponentType, constants} from "./enums";
import {ApplicationContext, TestingContext} from "./base";
import {Container} from "./container";
import {getAllPropertyNames} from "./utils";
import {DependencyKey} from "./dependencyKey";

export abstract class Component<T = any> {
    public getScope(): ScopeImpl {
        throw "not implemented";
    }

    public getType(): ComponentType {
        throw "not implemented";
    }

    public getConstructDependencyList(): Component[] {
        throw "not implemented";
    }

    public construct(_container: Container, ..._params: any[]): T {
        throw "not implemented";
    }

    public postConstruct(_container: Container, _instance: T) {
        throw "not implemented";
    }

    public isApplicationContext(): boolean {
        return false;
    }
}

export class ClassComponent<T> extends Component<T> {

    private static map: Map<object, ClassComponent<any>> = new Map<object, ClassComponent<any>>();
    private _Class: new(...args: any[]) => T;

    get Class(): { new(...args: any[]): T } {
        return this._Class;
    }

    public static create<T>(Class: new (...args: any[]) => T): ClassComponent<T> {
        if (!this.map.has(Class)) {
            this.map.set(Class, new ClassComponent<T>(Class));
        }

        return this.map.get(Class) as ClassComponent<T>;
    }

    private constructor(Class: new (...args: any[]) => T) {
        super();
        this._Class = Class;
    }

    public getScope(): ScopeImpl {
        return Reflect.getMetadata(constants.scope, this._Class) || getDefaultScope();
    }

    public getType(): ComponentType {
        return Reflect.getMetadata(constants.componentType, this._Class);
    }

    public getConstructDependencyList(): Component[] {
        const Classes = Reflect.getMetadata("design:paramtypes", this._Class) as any[] || [];
        const objectKeys = Reflect.getMetadata(constants.keys, this._Class) as any[]

        return ClassComponent.getComponents(Classes, objectKeys);
    }

    public construct(_container: Container, ..._params: any[]): T {
        return new this._Class(..._params);
    }

    private static getComponents(types: any[], key: any[]): Component[] {
        const map: Component[] = types.map(Class => ClassComponent.create(Class));

        if (key) {
            key.forEach((obj, index) => {
                if (obj) {
                    map[index] = DependencyComponent.create(obj)
                }
            })
        }

        return map;
    }


    public postConstruct(container: Container, instance: any) {
        const Class = this._Class;

        for (let key of getAllPropertyNames(Class.prototype)) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                let Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key) as any[] || [];
                const objectKeys = Reflect.getOwnMetadata(constants.keys, Class.prototype, key);
                Classes = ClassComponent.getComponents(Classes, objectKeys);
                (instance[key] as Function).apply(instance, container.getDependencyList(Classes));
            }
        }
    }

    public isApplicationContext(): boolean {
        const Class = this._Class;

        // @ts-ignore
        return Class === ApplicationContext || Class === TestingContext || Class === Container;
    }
}

export class DependencyComponent<T> extends Component<T> {
    private static map: Map<object, DependencyComponent<any>> = new Map<object, DependencyComponent<any>>();
    private key: DependencyKey<T>

    public static create<T>(key: DependencyKey<T>): DependencyComponent<T> {
        if (!this.map.has(key)) {
            this.map.set(key, new DependencyComponent<T>(key));
        }

        return this.map.get(key) as DependencyComponent<T>;
    }

    private constructor(key: DependencyKey<T>) {
        super();
        this.key = key;
    }

    public getScope(): ScopeImpl {
        return this.key.scope as ScopeImpl;
    }

    public getType(): ComponentType {
        return this.key.componentType;
    }

    public getConstructDependencyList(): Component[] {
        return [];
    }

    public construct(container: Container, ..._params: any[]): T {
        const factory = container.getDependenceFactory(this.key);

        if (!factory) {
            throw new Error("Factory for " + this.key + "not found.");
        }

        return factory(..._params) as T;
    }


    public postConstruct(_container: Container, _instance: any) {

    }
}