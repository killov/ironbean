import {createPropertyDecorator} from "./internals";

/**
 * @deprecated Does not work for code compiled with useDefineForClassFields: true
 * (native class field shadows the prototype accessor and throws at runtime).
 * Use inject.lazy() field initializer instead:
 *
 *     class Foo {
 *         bar = inject.lazy(Bar);
 *     }
 */
export const autowired = createPropertyDecorator({
    isConstant: context => context.isComponent,
    get(context) {
        return context.componentContext.getBean(context.type as any);
    }
});