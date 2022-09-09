import {ComponentContext, DependencyToken, LazyToken} from "./internals";

export type TClass<T> = new (...args: any[]) => T;
export interface IFactory<T> {
    create(...args: any[]): T
}
export interface IFactoryAsync<T> {
    createAsync(...args: any[]): Promise<T>
}

export type Dependency<TDependency> = TClass<TDependency>|DependencyToken<TDependency>|LazyToken<TDependency>;
export type FunctionFactory<TDependency> = (componentContext: ComponentContext) => TDependency;
export type FunctionAsyncFactory<TDependency> = (componentContext: ComponentContext) => Promise<TDependency>;
export type ComponentFactory<TDependency> = FunctionFactory<TDependency>|TClass<IFactory<TDependency>>;
export type ComponentAsyncFactory<TDependency> = FunctionAsyncFactory<TDependency>|TClass<IFactoryAsync<TDependency>>;