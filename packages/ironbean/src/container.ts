import {
    Component,
    component,
    ComponentContainer,
    ComponentType,
    containerStorage,
    Dependency,
    DependencyStorage,
    IConstructable,
    Scope,
    ScopeImpl
} from "./internals";
import {Stack} from "./stack";

@component(ComponentType.Singleton)
export class Container {
    protected readonly storage: DependencyStorage = new DependencyStorage();
    protected readonly parent: Container|null;
    protected readonly scope: ScopeImpl;
    protected readonly resolvingStack = new Stack<Component>();

    constructor(parent: Container|null = null, scope: ScopeImpl|null = null) {
        this.parent = parent;
        this.scope = scope ? scope : ScopeImpl.getDefault();
    }

    init() {
        this.storage.saveInstance(Component.create<Container>(Container), this);
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.getComponentInstance(Component.create(dependency));
    }

    public getComponent(component: Component): Component {
        return component.getComponent();
    }

    public getComponentInstance<T>(component: Component<T>): T {
        component = this.getComponent(component);
        const instance = this.storage.getInstance(component);

        if (instance === undefined) {
            const scope = component.getScope();
            if (scope === undefined || scope === this.getScope()) {
                if (!this.isConstructable(component)) {
                    throw new Error("I can't instantiate a " + component.name + " that is not a component.");
                }
                const type = component.getType();
                const componentContainer = new ComponentContainer(this);
                let instance;

                try {
                    if (type === ComponentType.Singleton && this.resolvingStack.contains(component)) {
                        this.throwCircularDependency(component);
                    }
                    this.resolvingStack.enqueue(component);
                    instance = this.buildNewInstance(component, componentContainer);
                } finally {
                    this.resolvingStack.dequeue();
                }

                if (type === ComponentType.Singleton) {
                    this.storage.saveInstance(component, instance);
                }
                this.runPostConstruct(instance, component, componentContainer);
                return instance;
            } else {
                return this.getContainerForScope(scope, component).getComponentInstance(component);
            }
        }

        return instance as T;
    }

    protected isConstructable<T>(component: IConstructable<T>): boolean {
        return component.isConstructable();
    }

    public getContainerForScope(scope: ScopeImpl, component?: Component): Container {
        const commonScope = ScopeImpl.getCommonParent(scope, this.getScope());
        const commonContainer = this.getParentContainerByScope(commonScope);

        if (commonContainer === undefined) {
            throw new Error("");
        }

        return commonContainer.getOrCreateContainerForScope(scope, component);
    }

    public getParentContainerByScope(scope: Scope): Container|undefined {
        if (this.getScope() === scope) {
            return this;
        }
        const parent = this.parent;

        if (parent === null) {
            return undefined;
        }

        return parent.getParentContainerByScope(scope);
    }

    private getOrCreateContainerForScope(scope: ScopeImpl, component?: Component): Container {
        if (scope === this.getScope()) {
            return this;
        }
        if (component !== undefined) {
            throw new Error("I can't create a container for (" + component.name + ") for scope (" + scope.toString() + "), Please use createOrGetParentContext for manual creation.");
        }
        const childScope = this.getScope().getDirectChildFor(scope);
        const container = this.createContainer(childScope);

        return container.getOrCreateContainerForScope(scope, component);
    }

    private createContainer(scope: ScopeImpl): Container {
        const container = new Container(this, scope);
        container.init();

        return container;
    }

    protected buildNewInstance<T>(component: IConstructable<T>, componentContainer: ComponentContainer): T {
        if (!this.isConstructable(component)) {
            throw new Error("I can't instantiate a " + component.name + " that is not constructable.");
        }
        return containerStorage.currentComponentContainerAction(componentContainer, () => {
            return component.construct(componentContainer)
        });
    }

    protected runPostConstruct(instance: any, component: Component, componentContainer: ComponentContainer) {
        component.postConstruct(componentContainer, instance);
    }

    protected getScope(): ScopeImpl {
        return this.scope;
    }

    public countOfDependencies(): number {
        return this.storage.countOfDependencies();
    }

    private throwCircularDependency(component: Component): void {
        const names = [];
        for (const i of this.resolvingStack.items) {
            names.push(i.name);
        }
        names.push(component.name);
        throw new Error("Circular dependency: " + names.join(" -> "));
    }
}

export const ContainerComponent = Component.create(Container);
