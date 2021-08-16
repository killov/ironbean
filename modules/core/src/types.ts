export type TClass<T> = new (...args: any[]) => T;
export interface Factory<T> {
    create(): T
}