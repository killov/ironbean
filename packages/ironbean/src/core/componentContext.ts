import {ApplicationContext, component, ComponentContainer, ComponentType, Container, Dependency} from "./internals";

@component(ComponentType.Prototype)
export class ComponentContext {
    private container: ComponentContainer;

    constructor(container: ComponentContainer) {
        this.container = container;
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.container.getBean(dependency);
    }

    public provideScope<T>(action: () => T) {
        return this.getBean(ApplicationContext).provideScope(action);
    }
}

export function createComponentContext(context: ApplicationContext): ComponentContext {
    const container = context.getBean(Container);
    const componentContainer = new ComponentContainer(container);

    return componentContainer.getBean(ComponentContext);
}