import {
    Component,
    component,
    ComponentContainer,
    ComponentType,
    containerStorage,
    Dependency,
    DependencyStorage,
    getDefaultScope,
    IConstructable,
    Scope,
    ScopeImpl,
    ScopeType
} from "./internals";
import {Stack} from "./stack";

@component(ComponentType.Singleton)
export class Container {
    protected readonly storage: DependencyStorage = new DependencyStorage();
    protected readonly parent: Container|null;
    protected readonly scope: ScopeImpl;
    protected readonly children: Container[] = [];
    protected readonly resolvingStack = new Stack<Component>();

    constructor(parent: Container|null = null, scope: ScopeImpl|null = null) {
        this.parent = parent;
        this.scope = scope ? scope : getDefaultScope() as ScopeImpl;
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
            if (component.getScope() === this.getScope() || component.isApplicationContext()) {
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
                return this.getContainerForScope(component.getScope(), component).getComponentInstance(component);
            }
        }

        return instance as T;
    }

    protected isConstructable<T>(component: Component<T>): boolean {
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
        const childScope = this.getScope().getDirectChildFor(scope);
        if (component !== undefined) {
            throw new Error("I can't create a container for (" + component.name + ") for scope (" + scope.toString() + "), Please use createOrGetParentContext for manual creation.");
        }
        const scopeId = childScope.getId();
        const container = this.children[scopeId] ?? this.createContainer(childScope);

        return container.getOrCreateContainerForScope(scope, component);
    }

    private createContainer(scope: ScopeImpl): Container {
        const container = new Container(this, scope);
        const scopeId = scope.getId();
        if (scope.getType() === ScopeType.Singleton) {
            this.children[scopeId] = container;
        }
        container.init();

        return container;
    }

    protected buildNewInstance<T>(component: IConstructable<T>, componentContainer: ComponentContainer): T {
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
