import {createPropertyDecorator} from "./internals";

export const autowired = createPropertyDecorator({
    isConstant: context => context.isComponent,
    get(context) {
        return context.componentContext.getBean(context.type as any);
    }
});