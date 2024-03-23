import {take, Container, ApplicationContext, DependencyToken} from "./internals";

type MapToType = {
    string: string;
    number: number;
    boolean: boolean;
}

type PrimitiveKeys = keyof MapToType;

type ConfigParams<T> = {
    [P in keyof T]: PrimitiveKeys | ConfigParams<any>
}

type Schema<T> = {
    [P in keyof T]: T[P] extends PrimitiveKeys ? MapToType[T[P]] : Schema<T[P]>
}

type Config<T> = {
    [P in keyof T]: T[P] extends "string" ? DependencyToken<string> :
                    T[P] extends "number" ? DependencyToken<number> :
                    T[P] extends "boolean" ? DependencyToken<boolean> :
                    T[P] extends {} ? Config<T[P]> :
                    never;
} & {
    fill(context: ApplicationContext, values: Schema<T>): void
}

export function createConfig<T extends ConfigParams<any>>(params: T): Config<T> {
    const cfg = _createConfig(params);
    cfg.fill = (context: ApplicationContext, values: any) => {
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
                take(token).setClassType(String);
                break;
            case "number":
                take(token).setClassType(Number);
                break;
            case "boolean":
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