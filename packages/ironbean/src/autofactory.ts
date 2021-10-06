import {
    ApplicationContext,
    autowired,
    component,
    Component,
    ComponentType,
    Dependency,
    getDefaultScope,
    scope,
    Scope,
    TClass
} from "./internals";

interface AutoFactory<T> {
    create(): T;
}

interface ISettings {
    scope?: Scope;
}

export function AutoFactory<T>(dependency: Dependency<T>, settings?: ISettings): TClass<AutoFactory<T>> {
    const cmp = Component.create(dependency).getComponent();

    if (cmp.isConstructable()) {
        throw new Error(cmp.name + " for auto factory must be @component");
    }
    if (cmp.getType() !== ComponentType.Prototype) {
        throw new Error(cmp.name + " for auto factory must be ComponentType.Prototype");
    }

    @component
    @scope(settings?.scope ?? getDefaultScope())
    class FactoryClass implements AutoFactory<T> {
        @autowired
        private context: ApplicationContext;

        create(): T {
            return this.context.getBean(dependency);
        }
    }

    return FactoryClass;
}
