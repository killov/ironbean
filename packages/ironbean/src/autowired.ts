import {cacheMap, createPropertyDecorator} from "./internals";

const CACHE = Symbol("CACHE");

export const autowired = createPropertyDecorator({
    get(context) {
        return cacheMap(
            context.data,
            CACHE,
            () => context.componentContext.getBean(context.type as any)
        );
    }
});