import {CollectionToken, ComponentContainer, Container, IPlugin, PluginToken, take} from "./internals";
import {StorageMode} from "./storageMode";

class ContainerStorage {
    public container: Container | null = null;
    public currentComponentContainer: ComponentContainer | undefined;
    public currentContainer: Container | undefined;
    public mode: StorageMode = StorageMode.None;
    private _plugins: IPlugin[] = [];

    get plugins(): IPlugin[] {
        return this._plugins;
    }

    reloadPlugins(): void {
        this._plugins = this.resolvePlugins();
    }

    private resolvePlugins() {
        if (this.mode === StorageMode.Prototype) {
            const container = new Container();
            container.init();
            return container.getBean(CollectionToken.create(PluginToken)) as IPlugin[];
        }
        return this.container?.getBean(CollectionToken.create(PluginToken)) as IPlugin[] ?? [];
    }

    getOrCreateBaseContainer(): Container {
        if (!this.container) {
            if (this.mode === StorageMode.Prototype) {
                throw new Error("Create global container is not allowed for PROTOTYPE mode.")
            }
            this.mode = StorageMode.Singleton;
            this.container = this.createBaseContainer();
        }

        return this.container;
    }

    createBaseContainer(): Container {
        const container = new Container();
        this.initContainer(container);

        return container;
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