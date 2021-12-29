import {ComponentContainer, DependencyToken} from "./internals";

export interface IPlugin {
    getComponentContainerForClassInstance?(Class: object): ComponentContainer|undefined;
}

export const PluginToken = DependencyToken.create<IPlugin>("plugin");