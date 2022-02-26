import {ComponentContext, containerStorage} from "./internals";

export interface IPlugin {
    getContextForClassInstance?(Class: object): ComponentContext|undefined;
}

export function registerPlugin(plugin: IPlugin): void {
    containerStorage.registerPlugin(plugin);
}