import {
    ApplicationContext, autowired,
    component,
    ComponentContext,
    ComponentType,
    destroyContext,
    getBaseApplicationContext, postConstruct,
    take,
    Async
} from "../src";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";
import {IFactoryAsync} from "../src/types";

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

    it("getBean error async for class factory over autowired", async () => {
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

    it("getBeanAsync asdsa", async () => {
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
        }).toThrowError("Create instance of componentClass B failed. Constructor async dependency not supported.");

        expect(() => {
            applicationContext.getBean(C);
        }).toThrowError("Create instance of componentClass C failed. PostConstuct async dependency not supported.");
    })

    it ("getBeanWithMocksAsync 2", async () => {
        @component
        class A extends Async {

        }

        @component
        class B extends Async {
            constructor(public a: A) {
                super();
            }
        }

        //set async
        take(A).setAsyncFactory(() => Promise.resolve(new A()));

        const b1 = await applicationContext.getBeanAsync(B);
        const b2 = await applicationContext.getBeanAsync(B);


        const a = await applicationContext.getBeanAsync(A);

        expect(b1).toBe(b2);
        expect(b1.a).toBe(b2.a);
        expect(b1.a).toBe(a);
    });
});
