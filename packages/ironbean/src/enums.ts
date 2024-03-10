export const constants = {
    postConstruct: "_ioc_postConstruct",
    componentContainer: "_ioc_componentContainer",
    types: "_ioc_keys",
    lazy: "_ioc_lazy",
    collection: "_ioc_collection"
};

export enum ComponentType {
    Singleton,
    Prototype
}
