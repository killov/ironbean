import {
    ApplicationContext,
    autowired,
    component,
    destroyContext,
    getBaseApplicationContext,
} from "../src";
import {
    defineProperty,
    getOverriddenProps,
    installInstanceAccessors,
} from "../src/useDefClassFiedsHack";

// Reproduces the native class-field emit (SWC / ES2022+ targets): an own
// `value: undefined` property placed on the instance during construction that
// shadows the @autowired prototype accessor. We emulate it by defining that
// property inside the constructor via the saved-original `defineProperty`.
describe("installInstanceAccessors (native class field / SWC scenario)", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
    });

    afterEach(() => {
        destroyContext();
    });

    it("propOverridesSymbol is a shared global registry (multi-bundle safe)", () => {
        expect(Symbol.for("ironbean.useDefineForClassFields.propertyOverrides"))
            .toBe(Symbol.for("ironbean.useDefineForClassFields.propertyOverrides"));
    });

    it("resolves an @autowired field shadowed by a native-field own property (ClassComponent path)", () => {
        @component
        class Engine {
            run() { return "vroom"; }
        }

        @component
        class Car {
            @autowired declare engine: Engine;

            constructor() {
                // emulate `engine;` native class field shadowing the accessor
                defineProperty(this, "engine", {
                    value: undefined,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            }
        }

        const car = applicationContext.getBean(Car);

        expect(car.engine).toBeInstanceOf(Engine);
        expect(car.engine.run()).toBe("vroom");
        expect(car.engine).toBe(applicationContext.getBean(Engine));
    });

    it("getOverriddenProps walks the prototype chain", () => {
        @component
        class Base {
            @autowired declare a: Base;
        }

        @component
        class Derived extends Base {
            @autowired declare b: Base;
        }

        const props = getOverriddenProps(Derived.prototype);
        expect(props.has("a")).toBe(true);
        expect(props.has("b")).toBe(true);
    });

    it("is a no-op when there is nothing to restore", () => {
        class Plain {}
        const instance = new Plain();
        expect(() => installInstanceAccessors(instance, Plain.prototype)).not.toThrow();
    });

    it("does not break the already-working case (no shadow present)", () => {
        @component
        class Wheel {}

        @component
        class Bike {
            @autowired declare wheel: Wheel;
        }

        const bike = applicationContext.getBean(Bike);
        expect(bike.wheel).toBeInstanceOf(Wheel);
    });
});
