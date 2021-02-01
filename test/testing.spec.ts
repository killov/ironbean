import {
    autowired,
    component,
    dependence,
    destroyContext,
    postConstruct,
    getBaseTestingContext, TestingContext, getBaseApplicationContext, DependencyKey
} from "../src";
import {Container} from "../src/container";

describe("testing", () => {
    let testingContext: TestingContext;

    beforeEach(() => {
        testingContext = getBaseTestingContext();
        expectDependenciesCount(3);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(testingContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("inject by key", () => {
        const key = DependencyKey.create<string>();
        const key2 = DependencyKey.create<string>();
        const key3 = DependencyKey.create<b>();

        testingContext.addDependenceFactory(key, () => "datata");
        testingContext.addDependenceFactory(key2, () => "datata22");
        testingContext.addDependenceFactory(key3, () => new b());

        @component
        class a {
            test = "sa";

            constructor(@dependence(key) data: string, @dependence(key2) data2: string) {
                expect(data).toBe("datata");
                expect(data2).toBe("datata22");
            }

            @postConstruct
            post(@dependence(key3) data: b) {
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

            @dependence(key)
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
    })
});