import {getBaseJasmineTestingContext, getPropertyDescriptor, JasmineTestingContext} from "../src";
import {autowired, component, DependencyToken, destroyContext, postConstruct, take, type} from "ironbean";
import {Container} from "ironbean/dist/container";
import MockInstance = jest.MockInstance;

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
        const key = DependencyToken.create<string>("key");
        const key2 = DependencyToken.create<string>("key2");
        const key3 = DependencyToken.create<b>("key3");

        take(key).setFactory(() => "datata");
        take(key2).setFactory(() => "datata22");
        take(key3).setFactory(() => new b());

        @component
        class a {

            get g(): number {
                return 5;
            }

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

            getBum(): number {
                return 5;
            }
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

        testingContext.getMock(a).getText.mockReturnValue("ahoja");
        const mock = testingContext.getMock(a);
        getPropertyDescriptor(mock, "g").get.mockReturnValue(100)

        @component
        class c {

            get a() : number{
                return 5;
            }

            constructor(a: a) {
                expect(a).toBe(ia1);
                expect(a.f).not.toHaveBeenCalled();
                a.f();
                expect(a.getText()).toBe("ahoja");
                expect(a.g).toBe(100);
                expect(a.f).toHaveBeenCalled();
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        jest.spyOn(c.prototype, "postConstruct");
        testingContext.getMock(key3).getBum.mockReturnValue(4);

        const ic1 = testingContext.getBeanWithMocks(c);
        expect(testingContext.getBean(key3).getBum()).toBe(4);
        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);
    });

    it("inject by class key class return of factory", () => {
        class Cisilko extends DependencyToken.Number {}
        let i = 0;

        @component
        class A {
            @autowired
            num: Cisilko;
        }

        take(Cisilko).setFactory(() => i++);
        expect(testingContext.getBean(Cisilko)).toBe(1);
    });

    it("inject by dependency token String", () => {
        class Retizek extends DependencyToken.String {}

        @component
        class A {
            @autowired
            num: Retizek;
        }

        take(Retizek).setFactory(() => "retizek");
        expect(testingContext.getBean(Retizek)).toBe("string");
    });

    it("inject by dependency token bool", () => {
        class Retizek extends DependencyToken.Boolean {}

        @component
        class A {
            @autowired
            num: Retizek;
        }

        take(Retizek).setFactory(() => true);
        expect(testingContext.getBean(Retizek)).toBe(true);
    });

    it("inject by dependency token Array", () => {
        class Cisilka extends DependencyToken.Array<number> {}

        @component
        class A {
            @autowired
            cisilka: Cisilka;
        }

        take(Cisilka).setFactory(() => [1, 2]);
        expect(testingContext.getBean(Cisilka)).toEqual([]);
    });

    it("inject by dependency token Map", () => {
        class Cisilka extends DependencyToken.Map<number, number> {}

        @component
        class A {
            @autowired
            cisilka: Cisilka;
        }

        const map = new Map<number, number>();

        take(Cisilka).setFactory(() => map);
        expect(testingContext.getBean(Cisilka)).toEqual(new Map());
    });

    it("inject by dependency token Set", () => {
        class Cisilka extends DependencyToken.Set<number> {}

        @component
        class A {
            @autowired
            cisilka: Cisilka;
        }

        const set = new Set<number>();

        take(Cisilka).setFactory(() => set);
        expect(testingContext.getBean(Cisilka)).toEqual(new Set());
    });
});
