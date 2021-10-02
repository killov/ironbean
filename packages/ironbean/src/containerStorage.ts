import {ComponentContainer, Container, TestContainer} from "./internals";

let container: Container | null;

export function getBaseContainer(): Container {
    if (!container) {
        container = new Container();
        container.init();
    }

    return container;
}

export function getTestContainer(): TestContainer {
    if (!container) {
        container = new TestContainer();
        container.init();
    }

    if (!(container instanceof TestContainer)) {
        throw new Error("You can't get test container because another container already exists.");
    }

    return container;
}

export function destroyContainer(): void {
    currentComponentContainer = undefined;
    container = null;
}

export let currentComponentContainer: ComponentContainer | undefined;
export let currentContainer: Container | undefined;

export function currentComponentContainerAction<T>(componentContainer: ComponentContainer, action: () => T): T {
    const oldComponentContainer = currentComponentContainer;
    currentComponentContainer = componentContainer;
    try {
        return action();
    } finally {
        currentComponentContainer = oldComponentContainer;
    }
}

export function currentContainerAction<T>(container: Container, action: () => T): T {
    const oldComponentContainer = currentContainer;
    currentContainer = container;
    try {
        return action();
    } finally {
        currentContainer = oldComponentContainer;
    }
}
