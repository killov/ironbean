import {
    autowired,
    component,
    ComponentType,
    DependencyToken,
    destroyContext,
    getBaseApplicationContext,
    getBaseTestingContext,
    postConstruct,
    Scope,
    scope,
    take,
    TestingContext,
    type
} from "../src";
import {Container} from "../src/container";
import {TestProvider} from "../src/api";

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
        const key = DependencyToken.create<string>("key");
        const key2 = DependencyToken.create<string>("key2");
        const key3 = DependencyToken.create<b>("key3");

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

        expect(testingContext.getBean(key)).toBe(testingContext.getBean(key));
        expect(testingContext.getBean(key2)).toBe(testingContext.getBean(key2));

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
        @component
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

    it("disable Mock 2", () => {
        class A {
            a: string = "a";

            getA() {
                return "a";
            }
        }
        const acko = DependencyToken.create<A>("acko");
        take(acko).setFactory(() => new A());

        expect(testingContext.getBean(acko).getA()).toBe(undefined);

        destroyContext();
        testingContext = getBaseTestingContext();
        testingContext.disableMock(acko);
        expect(testingContext.getBean(acko).getA()).toBe("a");

        destroyContext();
        testingContext = getBaseTestingContext();
        testingContext.disableMock(acko);
        testingContext.enableMock(acko);

        expect(testingContext.getBean(acko).getA()).toBe(undefined);
    })

    it("unknown dependency mock", () => {
        interface I {
            test(): void;
            a: number;
        }
        const token = DependencyToken.create<I>("token");
        const mock = testingContext.getBean(token);
        mock.test();
        mock.a = 9;
        expect(mock.a).toBe(9);
    });

    it("set Mock", () => {
        @component
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
        testingContext.setMockFactory(A, () => mock);
        expect(testingContext.getBean(A).getA()).toBe("a");
        expect(testingContext.getBean(A)).toBe(mock);
    })

    it("set Mock factory without component", () => {
        class A {
            a: string = "a";

            getA() {
                return "a";
            }
        }

        class B extends A {

        }

        const mock = new B();
        testingContext.setMockFactory(A, () => mock);
        expect(testingContext.getBean(A).getA()).toBe("a");
        expect(testingContext.getBean(A)).toBe(mock);
    })

    it("test context for class created by factory", () => {
        @component(ComponentType.Prototype)
        class B {

        }

        @component
        class A {
            @autowired b: B;
        }

        testingContext.setMockFactory(A, () => new A())

        expect(testingContext.getBean(A)).toBe(testingContext.getBean(A));
        expect(testingContext.getBean(A).b).toBe(testingContext.getBean(A).b);
    });

    it("custom mocks", () => {

        @component
        class a {
            f = "ajp";
        }

        @component
        class b {
            @autowired a!: a;
            g = "haha";
        }

        @component
        class customA extends a {
            f = "moje vlastni";
            hmm =  10;
        }

        testingContext.setMock(a, customA);

        const iB = testingContext.getBeanWithMocks(b);
        expect(iB.a.f).toBe("moje vlastni");
    });

    it("custom mocks 2", () => {

        @component
        class a {
            f = "ajp";
        }

        @component
        class b {
            @autowired a!: a;
            g = "haha";
        }

        const becko = DependencyToken.create<b>("becko");
        take(becko).bindTo(b);

        @component
        class customA extends a {
            f = "moje vlastni";
            hmm =  10;
        }

        testingContext.setMock(a, customA);

        const iB = testingContext.getBeanWithMocks(becko);
        expect(iB.a.f).toBe("moje vlastni");
    });

    it("inject class without decorator", () => {
        class A {
            asd: string;
        }

        class B extends A {
            g: string;
        }

        expect(() => {
            testingContext.setMock(A, B);
        }).toThrowError("Mock factory Class B for dependency Class A must be @component.")
    });

    it("mock for dependendcy token null", () => {
        const token = DependencyToken.create<number|null>("token");

        testingContext.setMockFactory(token, () => null);
        @component
        class a {
            @autowired
            @type(token)
            a!: null;
        }

        @component
        class customA extends a {
            f = "moje vlastni";
            hmm =  10;
        }

        testingContext.setMock(a, customA);

        const iA = testingContext.getBeanWithMocks(a);
        expect(iA.a).toBe(null);
    });

    it("scopes", () => {
        const SCOPE = Scope.create("scope");

        @component
        @scope(SCOPE)
        class A {

        }

        const mock = new A();
        testingContext.setMockFactory(A, () => mock);

        expect(() => {
            testingContext.getBean(A);
        }).toThrowError("I can't create a container for (Class A) for scope (DEFAULT.scope), Please use createOrGetParentContext for manual creation.")

        const contextScope = testingContext.createOrGetParentContext(SCOPE);
        expect(contextScope.getBean(A)).not.toBe(mock);
        expect(contextScope.getBean(A)).toBe(contextScope.getBean(A));

        const contextScope2 = testingContext.createOrGetParentContext(SCOPE);
        contextScope2.setMockFactory(A, () => mock);
        expect(contextScope2.getBean(A)).toBe(mock);
        expect(contextScope2.getBean(A)).toBe(contextScope2.getBean(A));
    });

    it("dependency token set class type using mockClass", () => {
        class A {
            a: number;
        }

        const token = DependencyToken.create<A>("token");

        const mockClassSpy = spyOn(TestProvider.prototype, "mockClass");

        take(token).setClassType(A);
        const mock = testingContext.getMock(token);
        expect(mockClassSpy).toHaveBeenCalledWith(A);
    });
});