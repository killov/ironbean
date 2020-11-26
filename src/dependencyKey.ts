import {ComponentType} from "./enums";

interface ISettings {
    componentType?: ComponentType;
}

export class DependencyKey<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private constructor(componentType: ComponentType) {
        this._componentType = componentType;
    }

    public static create<TDependency>(settings: ISettings = {}) {
        return new DependencyKey<TDependency>(settings.componentType || ComponentType.Singleton);
    }

    get componentType(): ComponentType {
        return this._componentType;
    }
}