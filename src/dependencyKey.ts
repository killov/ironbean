export class DependencyKey<TDependency> {
    // @ts-ignore
    a: TDependency;
    private constructor() {
    }

    public static create<TDependency>() {
        return new DependencyKey<TDependency>();
    }
}