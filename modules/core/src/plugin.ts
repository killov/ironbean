import {ComponentContainer, constants, currentComponentContainer, getBaseContainer} from "./internals";

export interface IPlugin {
    getComponentContainerForClassInstance?(Class: object): ComponentContainer|undefined;
}

export const plugins: IPlugin[] = [];

export function registerPlugin(decorator: IPlugin) {
    plugins.push(decorator);
}