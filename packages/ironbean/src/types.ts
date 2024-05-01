import {Async, AsyncDependencyToken, ComponentContext, DependencyToken, LazyToken} from "./internals";

export type TNormalClass<T> = new (...args: any[]) => T;
export type TAbstractClass<T> = abstract new (...args: any[]) => T;
export type TClass<T> = TNormalClass<T>|TAbstractClass<T>;
export interface IFactory<T> {
    create(...args: any[]): T
}
export interface IFactoryAsync<T> {
    createAsync(...args: any[]): Promise<T>
}

export type Dependency<TDependency> = TClass<TDependency>|DependencyToken<TDependency>|LazyToken<TDependency>;
export type AsyncDependency<TDependency> = TClass<Async>|AsyncDependencyToken<TDependency>;
export type FunctionFactory<TDependency> = (componentContext: ComponentContext) => TDependency;
export type FunctionAsyncFactory<TDependency> = (componentContext: ComponentContext) => Promise<TDependency>;
export type ComponentFactory<TDependency> = FunctionFactory<TDependency>|TClass<IFactory<TDependency>>;
export type ComponentAsyncFactory<TDependency> = FunctionAsyncFactory<TDependency>|TClass<IFactoryAsync<TDependency>>;