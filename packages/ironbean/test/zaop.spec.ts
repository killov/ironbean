import {ApplicationContext, component, destroyContext, getBaseApplicationContext} from "../src";
import {createPropertyDecorator} from "../src/zaop";

describe("zaop", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
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

        it("data", () => {
            const decorator = createPropertyDecorator({
                get: (c) => {
                    if (!c.data.has("h")) {
                        c.data.set("h", 0)
                    }
                    c.data.set("h", c.data.get("h") + 1);

                    return c.data.get("h");
                }
            })

            @component
            class A {
                @decorator a;
            }

            const a = new A();

            expect(a.a).toBe(1);
            expect(a.a).toBe(2);
            expect(a.a).toBe(3);
        });
    });
});
