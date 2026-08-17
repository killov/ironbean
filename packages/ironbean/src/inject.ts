import {ComponentContainer, containerStorage, Dependency, ironbeanSettings, LazyToken} from "./internals";

export function inject<T>(dependency: Dependency<T>): T {
    const container = containerStorage.currentComponentContainer ?? getFallbackComponentContainer();
    if (container === undefined) {
        throw new Error("Function inject is allowed in constructor of @component only. Set ironbeanSettings.allowInjectOutsideComponent = true to allow it in other classes.")
    }
    return container.getBean(dependency);
}

// Pro tridy mimo container (povolene pres ironbeanSettings) resolvujeme
// ze zakladniho containeru, stejne jako to delal @autowired.
function getFallbackComponentContainer(): ComponentContainer | undefined {
    if (!ironbeanSettings.allowInjectOutsideComponent) {
        return undefined;
    }
    return new ComponentContainer(containerStorage.getOrCreateBaseContainer());
}

inject.lazy = function<T>(dependency: Dependency<T>): T {
    return inject(LazyToken.create(dependency));
}