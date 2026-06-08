import {ApplicationContext, component, destroyContext, getBaseApplicationContext} from "../src";
import {createPropertyDecorator} from "../src/zaop";
import {nativeFieldEmit} from "./emitMode";

// property dekoratory pod native field emitem nefunguji (own property zastini accessor)
const itAutowired = nativeFieldEmit ? it.skip : it;

describe("zaop", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
    })

    afterEach(() => {
        destroyContext();
    });

    describe("property", () => {
        itAutowired("constant", () => {
            const spy = jest.fn()
            const decorator = createPropertyDecorator({
                isConstant: true,
                get: () => {
                    spy();
                    return 10;
                }
            })

            class A {
                @decorator a = 1;
            }

            const a = new A();

            expect(a.a).toBe(10);
            expect(a.a).toBe(10);
            expect(a.a).toBe(10);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
