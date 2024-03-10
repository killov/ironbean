import {containerStorage, Dependency, LazyToken} from "./internals";

export function inject<T>(dependency: Dependency<T>): T {
    if (containerStorage.currentComponentContainer === undefined) {
        throw new Error("Function inject is allowed in constructor of @component only.")
    }
    return containerStorage.currentComponentContainer.getBean(dependency);
}

inject.lazy = function<T>(dependency: Dependency<T>): T {
    return inject(LazyToken.create(dependency));
}