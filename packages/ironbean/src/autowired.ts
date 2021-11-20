import {createPropertyDecorator} from "./internals";

export const autowired = createPropertyDecorator({
    isConstant: false,
    get(context) {
        return context.componentContext.getBean(context.type as any)
    }
});