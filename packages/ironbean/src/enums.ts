export const constants = {
    component: "_ioc_component",
    postConstruct: "_ioc_postConstruct",
    componentType: "_ioc_componentType",
    componentContainer: "_ioc_componentContainer",
    types: "_ioc_keys",
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