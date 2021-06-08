import {
    autowired,
    component,
    type,
    destroyContext,
    postConstruct,
    getBaseTestingContext, TestingContext, getBaseApplicationContext, DependencyToken, take
} from "../src";
import {Container} from "../src/container";

describe("testing", () => {
    let testingContext: TestingContext;

    beforeEach(() => {
        testingContext = getBaseTestingContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(testingContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount + 1);
    }

    it("inject by key", () => {
        const key = DependencyToken.create<string>();
        const key2 = DependencyToken.create<string>();
        const key3 = DependencyToken.create<b>();

        take(key).setFactory(() => "datata");
        take(key2).setFactory(() => "datata22");
        take(key3).setFactory(() => new b());

        @component
        class a {
            test = "sa";

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

        testingContext.getMock(a).getText = () => "ahoja";

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
                spyOn(a, "f");
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

    it("get test container because another container already exists", () => {
        destroyContext();
        getBaseApplicationContext();
        expect(() => {
            getBaseTestingContext();
        }).toThrow(new Error("You can't get test container because another container already exists."));
    })

    it("disable Mock", () => {
        class A {
            a: string = "a";

            getA() {
                return "a";
            }
        }

        expect(testingContext.getBean(A).getA()).toBe(undefined as any);

        destroyContext();
        testingContext = getBaseTestingContext();
        testingContext.disableMock(A);
        expect(testingContext.getBean(A).getA()).toBe("a");

        destroyContext();
        testingContext = getBaseTestingContext();
        testingContext.disableMock(A);
        testingContext.enableMock(A);

        expect(testingContext.getBean(A).getA()).toBe(undefined as any);
    })

    it("set Mock", () => {
        class A {
            a: string = "a";

            getA() {
                return "a";
            }
        }

        class B extends A {

        }

        expect(testingContext.getBean(A).getA()).toBe(undefined as any);

        destroyContext();
        testingContext = getBaseTestingContext();
        const mock = new B();
        testingContext.setMock(A, mock);
        expect(testingContext.getBean(A).getA()).toBe("a");
        expect(testingContext.getBean(A)).toBe(mock);
    })


    it("custom mocks", () => {

        @component
        class a {
            f = "ajp";
        }

        class b {
            @autowired a!: a;
            g = "haha";
        }

        class customA extends a {
            f = "moje vlastni";
        }

        testingContext.setMock(a, customA);

        const iB = testingContext.getBeanWithMocks(b);
        expect(iB.a.f).toBe("moje vlastni");
    });
});