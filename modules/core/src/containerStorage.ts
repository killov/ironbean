import {Container, TestContainer} from "./internals";

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
    container = null;
}