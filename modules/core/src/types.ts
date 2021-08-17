export type TClass<T> = new (...args: any[]) => T;
export interface IFactory<T> {
    create(): T
}