import {
    ApplicationContext,
    autowired,
    component,
    type,
    DependencyKey,
    destroyContext,
    getBaseApplicationContext,
    getDefaultScope,
    postConstruct,
    scope,
    ScopeType
} from "../src";
import {Container} from "../src/container";
import {ComponentType} from "../src/enums";

describe("test", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
        expectDependenciesCount(3);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(applicationContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("test 1", () => {
        @component
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a!: a;
        }

        expectDependenciesCount(3);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(5);

        expect(ib1.a).toBe(ia1);
        expect(ib1).toBe(ib2);
        expect(ib1).toBe(ib3);
        expect(ib1).toBe(ib4);
        expect(ia1).toBe(ia2);
        expect(ia1).toBe(ia3);
        expect(ia1).toBe(ia4);

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        spyOn(c.prototype, "postConstruct").and.callThrough();
        const ic1 = applicationContext.getBean(c);

        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);
    });

    it("inject by key null return of factory", () => {
        const key = DependencyKey.create<string|null>();

        applicationContext.addDependenceFactory(key, () => null);

        expect(applicationContext.getBean(key)).toBe(null);
        expect(applicationContext.getBean(key)).toBe(null);
    });

    it("inject by key singleton return of factory", () => {
        const key = DependencyKey.create<number>();
        let i = 0;

        applicationContext.addDependenceFactory(key, () => i++);

        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(0);
    });

    it("inject by key prototype return of factory", () => {
        const key = DependencyKey.create<number>({componentType: ComponentType.Prototype});
        let i = 0;

        applicationContext.addDependenceFactory(key, () => i++);

        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(1);
        expect(applicationContext.getBean(key)).toBe(2);
    });

    it("inject by key without factory", () => {
        const key = DependencyKey.create<number>({componentType: ComponentType.Prototype});

        expect(() => {
            applicationContext.getBean(key);
        }).toThrow();
    });

    it("inject by key", () => {
        const key = DependencyKey.create<string>();
        const key2 = DependencyKey.create<string>();
        const key3 = DependencyKey.create<b>();

        applicationContext.addDependenceFactory(key, () => "datata");
        applicationContext.addDependenceFactory(key2, () => "datata22");
        applicationContext.addDependenceFactory(key3, () => new b());

        @component
        class a {
            test = "sa";

            constructor(@type(key) data: string, @type(key2) data2: string) {
                expect(data).toBe("datata");
                expect(data2).toBe("datata22");
            }

            @postConstruct
            post(@type(key3) data: b) {
                expect(data instanceof  b).toBe(true);
            }
        }

        @component
        class b {
            @autowired a!: a;

            @type(key)
            @autowired
            data!: string;
        }

        const ib1 = applicationContext.getBean(b);
        const ib2 = applicationContext.getBean(b);
        const ib3 = applicationContext.getBean(b);
        const ib4 = applicationContext.getBean(b);
        const ia1 = applicationContext.getBean(a);
        const ia2 = applicationContext.getBean(a);
        const ia3 = applicationContext.getBean(a);
        const ia4 = applicationContext.getBean(a);

        expect(ib1.a === ia1).toBe(true);
        expect(ib1.a === ia1).toBe(true);
        expect(ib1.data).toBe("datata");
        expect(ib1).toBe(ib2);
        expect(ib1).toBe(ib3);
        expect(ib1).toBe(ib4);
        expect(ia1).toBe(ia2);
        expect(ia1).toBe(ia3);
        expect(ia1).toBe(ia4);

        expect(applicationContext.getBean(key)).toBe("datata");
        expect(applicationContext.getBean(key2)).toBe("datata22");

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        spyOn(c.prototype, "postConstruct").and.callThrough();
        const ic1 = applicationContext.getBean(c);

        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);
    });

    it("scopes prototype", () => {
        @component
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a!: a;
        }

        const ticket = getDefaultScope().createScope("ticket");


        @component
        @scope(ticket)
        class Ticket {
            idTicket: number = 10;

            @autowired
            applicationContext!: ApplicationContext;

            constructor(context: ApplicationContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context).toBe(this.applicationContext);
            }

            @postConstruct
            post(context: ApplicationContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context).toBe(this.applicationContext);
            }
        }

        @component
        @scope(ticket)
        class TicketData {
            name: string = "name";
        }

        expectDependenciesCount(3);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ticket1 = applicationContext.getBean(Ticket);
        expectDependenciesCount(5);
        const ticket2 = applicationContext.getBean(Ticket);
        expectDependenciesCount(5);

        expect(ib1.a).toBe(ia1);
        expect(ib1).toBe(ib2);
        expect(ib1).toBe(ib3);
        expect(ib1).toBe(ib4);
        expect(ia1).toBe(ia2);
        expect(ia1).toBe(ia3);
        expect(ia1).toBe(ia4);

        expect(ticket1.idTicket).toBe(10);
        expect(ticket2.idTicket).toBe(10);
        expect(ticket1).not.toBe(ticket2);

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        spyOn(c.prototype, "postConstruct").and.callThrough();
        const ic1 = applicationContext.getBean(c);

        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);
    });

    it("scopes singleton", () => {
        @component
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a!: a;
        }

        const ticket = getDefaultScope().createScope("ticket", ScopeType.Singleton);


        const key = DependencyKey.create<Object>({
            scope: ticket
        });

        applicationContext.addDependenceFactory(key, () => new Object());

        @component
        @scope(ticket)
        class Ticket {
            idTicket: number = 10;

            @autowired
            applicationContext!: ApplicationContext;

            @autowired
            a!: a;

            constructor(context: ApplicationContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context.getBean(key)).toBe(context.getBean(key));
                //expect(context).toBe(this.applicationContext);
            }

            @postConstruct
            post(context: ApplicationContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context.getBean(key)).toBe(context.getBean(key));
                expect(context).toBe(this.applicationContext);
                expect(applicationContext.getBean(a)).toBe(this.a);
            }
        }

        @component
        @scope(ticket)
        class TicketData {
            name: string = "name";
        }

        expectDependenciesCount(3);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(4);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(5);
        const ticket1 = applicationContext.getBean(Ticket);
        expectDependenciesCount(5);
        const ticket2 = applicationContext.getBean(Ticket);
        expectDependenciesCount(5);

        expect(ib1.a).toBe(ia1);
        expect(ib1).toBe(ib2);
        expect(ib1).toBe(ib3);
        expect(ib1).toBe(ib4);
        expect(ia1).toBe(ia2);
        expect(ia1).toBe(ia3);
        expect(ia1).toBe(ia4);

        expect(ticket1.idTicket).toBe(10);
        expect(ticket2.idTicket).toBe(10);
        expect(ticket1).toBe(ticket2);

        @component
        class c {
            constructor(a: a) {
                expect(a).toBe(ia1);
            }

            @postConstruct
            postConstruct(b: b, c: c) {
                expect(b).toBe(ib1);
                expect(c).toBe(this);
            }
        }
        spyOn(c.prototype, "postConstruct").and.callThrough();
        const ic1 = applicationContext.getBean(c);

        expect(c.prototype.postConstruct).toHaveBeenCalledTimes(1);
        expect(c.prototype.postConstruct).toHaveBeenCalledWith(ib2, ic1);
    });

    describe("autowired tests", () => {
        @component
        class B {

        }

        @component(ComponentType.Prototype)
        class C {

        }

        @component
        class A {
            @autowired b!: B;
            @autowired c!: C;
        }

        it("test1", () => {
            let context = getBaseApplicationContext();
            const oldB = context.getBean(A).b;
            const oldC = context.getBean(A).c;
            expect(context.getBean(A).b).toBe(oldB);
            expect(context.getBean(B)).toBe(oldB);
            expect(context.getBean(A).c).toBe(oldC);
            expect(context.getBean(C)).not.toBe(oldC);

            destroyContext();
            context = getBaseApplicationContext();
            expect(context.getBean(A).b).not.toBe(oldB);
            expect(context.getBean(B)).not.toBe(oldB);
            expect(context.getBean(A).c).not.toBe(oldC);
            expect(context.getBean(C)).not.toBe(oldC);
        });
    });
});