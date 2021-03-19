import {getBaseJasmineTestingContext, getPropertyDescriptor, JasmineTestingContext} from "../src";
import {autowired, component, DependencyToken, destroyContext, postConstruct, take, type} from "fire-dic";
import {Container} from "fire-dic/dist/container";

describe("jasmine testing", () => {
    let testingContext: JasmineTestingContext;

    beforeEach(() => {
        testingContext = getBaseJasmineTestingContext();
        expectDependenciesCount(3);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(testingContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("inject by key", () => {
        const key = DependencyToken.create();
        const key2 = DependencyToken.create();
        const key3 = DependencyToken.create();

        take(key).setFactory(() => "datata");
        take(key2).setFactory(() => "datata22");
        take(key3).setFactory(() => new b());

        @component
        class a {
            test = "sa";

            get property(): string {
                return "str";
            }

            constructor(@type(key) data: string, @type(key2) data2: string) {
                expect(data).toBe("datata");
                expect(data2).toBe("datata22");
            }

            @postConstruct
            post(@type(key3) data: b) {
                expect(data instanceof b).toBe(true);
            }

            f() {

            }

            getText() {
                return "ahoj1";
            }
        }

        @component
        class b {
            @autowired a!: a;

            @type(key)
            @autowired
            data!: string;
        }

        const ib1 = testingContext.getBean(b);
        const ib2 = testingContext.getBean(b);
        const ib3 = testingContext.getBean(b);
        const ib4 = testingContext.getBean(b);
        const ia1 = testingContext.getBean(a);
        const ia2 = testingContext.getBean(a);
        const ia3 = testingContext.getBean(a);
        const ia4 = testingContext.getBean(a);


        expect(ib1).toBe(ib2);
        expect(ib1).toBe(ib3);
        expect(ib1).toBe(ib4);
        expect(ia1).toBe(ia2);
        expect(ia1).toBe(ia3);
        expect(ia1).toBe(ia4);

        expect(testingContext.getBean(key)).toBe("datata");
        expect(testingContext.getBean(key2)).toBe("datata22");
        debugger
        const m = testingContext.getMock(a)
        m.getText.and.returnValue("ahoja");

        expect(testingContext.getBean(a).property).toBe(undefined as any);

        getPropertyDescriptor(m, "property").get.and.returnValue("ahoja");

        expect(testingContext.getBean(a).property).toBe("ahoja");

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
                expect(a.f).not.toHaveBeenCalled();
                a.f();
                expect(a.getText()).toBe("ahoja");
                expect(a.f).toHaveBeenCalled();
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        spyOn(c.prototype, "postConstruct").and.callThrough();

        const ic1 = testingContext.getBeanWithMocks(c);
        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);

    });
});