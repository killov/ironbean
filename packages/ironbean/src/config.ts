import {take, Container, ApplicationContext, DependencyToken} from "./internals";

type MapToType = {
    string: string;
    "?string": string|undefined;
    number: number;
    "?number": number|undefined;
    boolean: boolean;
    "?boolean": boolean|undefined;
}

type PrimitiveKeys = keyof MapToType;

type ConfigParams<T> = {
    [P in keyof T]: PrimitiveKeys | ConfigParams<any>
}

type Schema<T> = {
    [P in keyof T]: T[P] extends PrimitiveKeys ? MapToType[T[P]] : Schema<T[P]>
}

type Config<T> = ConfigChild<T> & {
    apply(context: ApplicationContext, values: Schema<T>): void
}

type ConfigChild<T> = {
    [P in keyof T]: T[P] extends "string" ? DependencyToken<string> :
                    T[P] extends "?string" ? DependencyToken<string|undefined> :
                    T[P] extends "number" ? DependencyToken<number> :
                    T[P] extends "?number" ? DependencyToken<number|undefined> :
                    T[P] extends "boolean" ? DependencyToken<boolean> :
                    T[P] extends "?boolean" ? DependencyToken<boolean|undefined> :
                    T[P] extends {} ? ConfigChild<T[P]> :
                    never;
};

export function createConfig<T extends ConfigParams<any>>(params: T): Config<T> {
    const cfg = _createConfig(params);
    cfg.apply = (context: ApplicationContext, values: any) => {
        const container = context.getBean(Container);
        fillConfig(container, cfg, values);
    }

    return cfg;
}

function _createConfig(params: any): any {
    const config: any = {};

    for (let key in params) {
        config[key] = resolveValue(params[key]);
    }

    return config;
}

function resolveValue(value: PrimitiveKeys | object): any {
    if (typeof value === "string") {
        const token = DependencyToken.create("asd");
        switch (value) {
            case "string":
            case "?string":
                take(token).setClassType(String);
                break;
            case "number":
            case "?number":
                take(token).setClassType(Number);
                break;
            case "boolean":
            case "?boolean":
                take(token).setClassType(Boolean);
                break;
        }

        return token;
    }
    return _createConfig(value);
}

function fillConfig(container: Container, config: any, values: any) {
    for (let key in config) {
        const value = config[key];
        if (value instanceof DependencyToken) {
            container.setValue(value as any, values[key]);
        } else {
            fillConfig(container, value as any, values[key])
        }
    }
}