import {
    ApplicationContext, autowired,
    collection,
    component,
    ComponentContext,
    ComponentType,
    destroyContext,
    getBaseApplicationContext, postConstruct,
    take,
    type,
    Async,
    Scope,
    scope
} from "../src";
import {CollectionToken} from "../src/collection";
import {DependencyToken} from "../src/dependencyToken";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";
import {IFactoryAsync} from "../src/types";
import {nativeFieldEmit} from "./emitMode";

const itAutowired = nativeFieldEmit ? it.skip : it;

describe("test async", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined)
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(applicationContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("getBeanAsync", async () => {
        @component
        class A {

        }

        const a1 = await applicationContext.getBeanAsync(A);
        const a2 = await applicationContext.getBeanAsync(A);
        expect(a1).toBe(a2);
    })

    it("getBean error async", async () => {
        class A extends Async {}

        take(A).setAsyncFactory(async () => {
            return Promise.resolve(new A());
        })

        expect(() => {
            const a1 = applicationContext.getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(ComponentContext).getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
    })

    it("getBean error async for class factory", async () => {
        class A extends Async {

        }

        class Factory implements IFactoryAsync<A> {
            createAsync(...args: any[]): Promise<A> {
                return Promise.resolve(new A);
            }
        }

        take(A).setAsyncFactory(Factory)

        expect(() => {
            const a1 = applicationContext.getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(ComponentContext).getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
    })

    itAutowired("getBean error async for class factory over autowired", async () => {
        class A extends Async {

        }

        @component
        class B {
            @autowired
            a: A;
        }

        class Factory implements IFactoryAsync<A> {
            createAsync(...args: any[]): Promise<A> {
                return Promise.resolve(new A);
            }
        }

        take(A).setAsyncFactory(Factory)


        const b = applicationContext.getBean(B);

        expect(() => {
            b.a
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(ComponentContext).getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
    })

    it("getBeanAsync prototype scope", async () => {
        class A extends Async {

        }

        take(A).setType(ComponentType.Prototype)
        take(A).setAsyncFactory(async () => {
            return Promise.resolve(new A());
        })

        const a1 = await applicationContext.getBeanAsync(A);
        const a2 = await applicationContext.getBeanAsync(A);
        expect(a1).not.toBe(a2);

        const componentContext = applicationContext.getBean(ComponentContext);

        const a3 = await componentContext.getBeanAsync(A);
        const a4 = await componentContext.getBeanAsync(A);
        expect(a3).toBe(a4);

    })

    it("getBean class with async dependency", async () => {
        class A extends Async {

        }

        take(A).setType(ComponentType.Prototype)
        take(A).setAsyncFactory(async () => {
            return Promise.resolve(new A());
        })

        @component
        class B {
            constructor(a: A) {
            }
        }

        @component
        class C {
            constructor() {
            }

            @postConstruct
            post(a: A) {

            }
        }

        expect(() => {
            applicationContext.getBean(B);
        }).toThrowError("Create instance of component Class B failed. Constructor async dependency not supported.");

        expect(() => {
            applicationContext.getBean(C);
        }).toThrowError("Create instance of component Class C failed. PostConstruct async dependency not supported.");
    })

    itAutowired ("getBeanWithMocksAsync 2", async () => {
        const sc = Scope.create("scope");
        @component
        @scope(sc)
        class A extends Async {

        }

        @component
        @scope(sc)
        class C {

        }

        @component
        @scope(sc)
        class D extends Async{

        }
        const postSpy = jest.fn();
        @component
        @scope(sc)
        class B extends Async {
            @autowired c: C;
            constructor(public a: A, c: C) {
                super();
                expect(this.c).toBe(c);
            }

            @postConstruct
            post(d: D) {
                postSpy();
            }
        }

        //set async
        take(A).setAsyncFactory(() => Promise.resolve(new A()));

        const context = applicationContext.createOrGetParentContext(sc);
        const b1 = await context.getBeanAsync(B);
        const b2 = await context.getBeanAsync(B);

        const a = await context.getBeanAsync(A);

        expect(postSpy).toBeCalledTimes(1);
        expect(b1).toBe(b2);
        expect(b1.a).toBe(b2.a);
        expect(b1.a).toBe(a);
    });

    it("collection of sync components", () => {
        class A {}

        @component
        class AA extends A {}

        @component
        class AB extends A {}

        take(A).bindTo(AA);
        take(A).bindTo(AB);

        const items = applicationContext.getBean(CollectionToken.create(A)) as any as A[];

        expect(items.length).toBe(2);
        expect(items[0] instanceof AA).toBe(true);
        expect(items[1] instanceof AB).toBe(true);
    })

    it("collection of async components", async () => {
        class A extends Async {}

        @component
        class AA extends A {}

        @component
        class AB extends A {}

        take(A).bindTo(AA);
        take(A).bindTo(AB);

        expect(() => {
            applicationContext.getBean(CollectionToken.create(A));
        }).toThrowError("Getting bean for component Collection Class A failed. Bean has async dependency.");

        const items = await applicationContext.getBeanAsync(CollectionToken.create(A) as any) as A[];

        expect(items.length).toBe(2);
        expect(items.map(item => item.constructor.name)).toEqual(["AA", "AB"]);
        expect(items[0] instanceof AA).toBe(true);
        expect(items[1] instanceof AB).toBe(true);
    })

    it("collection of async components injected into async component", async () => {
        class A extends Async {}

        @component
        class AA extends A {}

        @component
        class AB extends A {}

        take(A).bindTo(AA);
        take(A).bindTo(AB);

        @component
        class B extends Async {
            constructor(
                @collection
                @type(() => A)
                public items: A[]
            ) {
                super();
            }
        }

        const b = await applicationContext.getBeanAsync(B);

        expect(b.items.length).toBe(2);
        expect(b.items.map(item => item.constructor.name)).toEqual(["AA", "AB"]);
        expect(b.items[0] instanceof AA).toBe(true);
        expect(b.items[1] instanceof AB).toBe(true);
    })

    it("async token with sync factory stays async", async () => {
        class A {}

        const token = DependencyToken.createAsync<A>("tokenC");

        take(token).setFactory(() => new A());

        expect(() => {
            applicationContext.getBean(token);
        }).toThrowError("Getting bean for component tokenC failed. Bean has async dependency.");

        const a = await applicationContext.getBeanAsync(token);
        expect(a instanceof A).toBe(true);
    })

    it("collection mixing sync and async components", async () => {
        class A {}

        @component
        class AA extends A {}

        class AB extends A {}

        const asyncAB = DependencyToken.createAsync<AB>("asyncAB");
        take(asyncAB).setAsyncFactory(async () => new AB());

        take(A).bindTo(AA);
        take(A).bindTo(asyncAB);

        expect(() => {
            applicationContext.getBean(CollectionToken.create(A) as any);
        }).toThrowError("Getting bean for component Collection Class A failed. Bean has async dependency.");

        const items = await applicationContext.getBeanAsync(CollectionToken.create(A) as any) as A[];

        expect(items.map(item => item.constructor.name)).toEqual(["AA", "AB"]);
        expect(items[0] instanceof AA).toBe(true);
        expect(items[1] instanceof AB).toBe(true);
    })
});
