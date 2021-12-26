export const constants = {
    component: "_ioc_component",
    postConstruct: "_ioc_postConstruct",
    componentType: "_ioc_componentType",
    componentContainer: "_ioc_componentContainer",
    componentInstanceData: "_ioc_componentInstanceData",
    types: "_ioc_keys",
    lazy: "_ioc_lazy",
    scope: "_ioc_scope"
};

export enum ComponentType {
    Singleton,
    Prototype
}
