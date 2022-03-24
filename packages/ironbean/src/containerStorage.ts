import {CollectionToken, ComponentContainer, Container, IPlugin, PluginToken, take} from "./internals";

class ContainerStorage {
    public container: Container | null = null;
    public currentComponentContainer: ComponentContainer | undefined;
    public currentContainer: Container | undefined;
    private _plugins: IPlugin[] = [];

    get plugins(): IPlugin[] {
        return this._plugins;
    }

    reloadPlugins(): void {
        this._plugins = this.container?.getBean(CollectionToken.create(PluginToken)) as IPlugin[] ?? [];
    }

    getBaseContainer(): Container {
        if (!this.container) {
            this.container = new Container();
            this.initContainer(this.container);
        }

        return this.container;
    }

    initContainer(container: Container) {
        container.init();
        this.reloadPlugins();
    }

    destroyContainer(): void {
        this.currentComponentContainer = undefined;
        this.container = null;
    }

    currentComponentContainerAction<T>(componentContainer: ComponentContainer, action: () => T): T {
        const oldComponentContainer = this.currentComponentContainer;
        this.currentComponentContainer = componentContainer;
        try {
            return action();
        } finally {
            this.currentComponentContainer = oldComponentContainer;
        }
    }

    currentContainerAction<T>(container: Container, action: () => T): T {
        const oldComponentContainer = this.currentContainer;
        this.currentContainer = container;
        try {
            return action();
        } finally {
            this.currentContainer = oldComponentContainer;
        }
    }

    dispose(): void {
        take(PluginToken).clear();
        containerStorage = new ContainerStorage();
    }
}

export let containerStorage = new ContainerStorage();