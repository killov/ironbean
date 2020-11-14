import {
    ApplicationContext,
    autowired,
    component,
    dependence, DependencyKey,
    destroyContext,
    getBaseApplicationContext,
    getDefaultScope,
    postConstruct,
    scope, ScopeType
} from "../src";
import {Container} from "../src/container";

describe("test", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(applicationContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount)
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

        expectDependenciesCount(2);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(4);

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

            constructor(@dependence(key) data: string, @dependence(key2) data2: string) {
                expect(data).toBe("datata");
                expect(data2).toBe("datata22");
            }

            @postConstruct
            post(@dependence(key3) data: b) {
                expect(data instanceof  b).toBe(true);
            }
        }

        @component
        class b {
            @autowired a!: a;

            @dependence(key)
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

        expect(applicationContext.getDependence(key)).toBe("datata");
        expect(applicationContext.getDependence(key2)).toBe("datata22");

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

        expectDependenciesCount(2);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ticket1 = applicationContext.getBean(Ticket);
        expectDependenciesCount(4);
        const ticket2 = applicationContext.getBean(Ticket);
        expectDependenciesCount(4);

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

        expectDependenciesCount(2);
        const ib1 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib2 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib3 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ib4 = applicationContext.getBean(b);
        expectDependenciesCount(3);
        const ia1 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia2 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia3 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ia4 = applicationContext.getBean(a);
        expectDependenciesCount(4);
        const ticket1 = applicationContext.getBean(Ticket);
        expectDependenciesCount(4);
        const ticket2 = applicationContext.getBean(Ticket);
        expectDependenciesCount(4);

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
});