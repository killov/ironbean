export const constants = {
    component: "_ioc_component",
    postConstruct: "_ioc_postConstruct",
    componentType: "_ioc_componentType",
    container: "_ioc_container",
    scope: "_ioc_scope"
};

export enum ComponentType {
    Singleton,
    Prototype,
    Scope,
    ScopeSingleton
}