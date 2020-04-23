export const constants = {
    component: "_ioc_component",
    postConstruct: "_ioc_postConstruct",
    componentType: "_ioc_componentType",
    container: "_ioc_container",
    autowiredCache: "_ioc_autowiredCache"
};

export enum ComponentType {
    Singleton,
    Prototype
}