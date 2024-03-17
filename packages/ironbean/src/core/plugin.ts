import {ComponentContext, containerStorage, Dependency, DependencyToken, take} from "./internals";

export interface IPlugin {
    getContextForClassInstance?(instance: object): ComponentContext|undefined;
}

export function registerPlugin(plugin: Dependency<IPlugin>): void {
    take(PluginToken).bindTo(plugin);
    containerStorage.reloadPlugins();
}

export const PluginToken = DependencyToken.create<IPlugin>("plugin")