import {createPropertyDecorator} from "./internals";

export const autowired = createPropertyDecorator({
    get(context) {
        return context.componentContext.getBean(context.type as any);
    }
});