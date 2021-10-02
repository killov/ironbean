import {createMethodDecorator} from "./internals";

export const provideScope = createMethodDecorator({
    call: (c) => c.componentContext.provideScope(() => c.callMethod())
});
