export const constants = {
    component: "_ioc_component",
    postConstruct: "_ioc_postConstruct",
    componentType: "_ioc_componentType",
    container: "_ioc_container",
    autowiredCache: "_ioc_autowiredCache",
    autowired: "_ioc_autowired",
    keys: "_ioc_keys",
    scope: "_ioc_scope"
};

export enum ComponentType {
    Singleton,
    Prototype
}

export enum ScopeType {
    Singleton,
    Prototype
}