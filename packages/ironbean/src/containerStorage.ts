import {ComponentContainer, Container, TestContainer} from "./internals";

class ContainerStorage {
    private container: Container | null = null;
    public currentComponentContainer: ComponentContainer | undefined;
    public currentContainer: Container | undefined;

    getBaseContainer(): Container {
        if (!this.container) {
            this.container = new Container();
            this.container.init();
        }

        return this.container;
    }

    getTestContainer(): TestContainer {
        if (!this.container) {
            this.container = new TestContainer();
            this.container.init();
        }

        if (!(this.container instanceof TestContainer)) {
            throw new Error("You can't get test container because another container already exists.");
        }

        return this.container;
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
}

export const containerStorage = new ContainerStorage();