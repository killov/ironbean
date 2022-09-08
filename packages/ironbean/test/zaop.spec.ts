import {ApplicationContext, component, destroyContext, getRootAppContext} from "../src";
import {createPropertyDecorator} from "../src/core/zaop";

describe("zaop", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getRootAppContext();
    })

    afterEach(() => {
        destroyContext();
    });

    describe("property", () => {
        it("constant", () => {
            const spy = jasmine.createSpy("spy");
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
