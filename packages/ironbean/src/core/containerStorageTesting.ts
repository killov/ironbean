import {containerStorage, TestContainer} from "../testing/internalsTesting";

export function getTestContainer(): TestContainer {
    if (!containerStorage.container) {
        containerStorage.container = new TestContainer();
        containerStorage.initContainer(containerStorage.container);
    }

    if (!(containerStorage.container instanceof TestContainer)) {
        throw new Error("You can't get test container because another container already exists.");
    }

    return containerStorage.container;
}