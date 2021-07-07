import {
    ApplicationContext,
    autowired,
    component,
    ComponentContext,
    ComponentType,
    DependencyToken,
    destroyContext,
    getBaseApplicationContext,
    getDefaultScope,
    postConstruct,
    scope,
    ScopeType,
    take,
    type
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

    it("test 1 types", () => {
        @component
        class a {
            test = "sa";
        }

        @component
        class b {
            @type(() => a)
            @autowired a!: any;
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
            constructor(@type(() => a)a: any) {
                expect(a).toBe(ia1);
            }

            @postConstruct
            postConstruct(@type(() => b)b: any, @type(() => c)c: any) {
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
        const key = DependencyToken.create<string|null>("key");

        take(key).setFactory(() => null);

        expect(applicationContext.getBean(key)).toBe(null);
        expect(applicationContext.getBean(key)).toBe(null);
    });

    it("inject by key singleton return of factory", () => {
        const key = DependencyToken.create<number>("key");
        let i = 0;

        take(key).setFactory(() => i++);

        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(0);
    });

    it("inject by key prototype return of factory", () => {
        const key = DependencyToken.create<number>("key", {componentType: ComponentType.Prototype});
        let i = 0;

        take(key).setFactory(() => i++);

        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(1);
        expect(applicationContext.getBean(key)).toBe(2);
    });

    it("inject by key prototype return of factory - test component context", () => {
        const key = DependencyToken.create<number>("key", {componentType: ComponentType.Prototype});
        const key2 = DependencyToken.create<number>("key2", {componentType: ComponentType.Prototype});
        let i = 0;

        take(key).setFactory(() => i++);
        take(key2).setFactory((context) => {
            expect(context.getBean(key)).toBe(context.getBean(key));

            return context.getBean(key) + context.getBean(key);
        });

        expect(applicationContext.getBean(key)).toBe(0);
        expect(applicationContext.getBean(key)).toBe(1);
        expect(applicationContext.getBean(key)).toBe(2);
        expect(applicationContext.getBean(key2)).toBe(6);
        expect(applicationContext.getBean(key2)).toBe(8);
        expect(applicationContext.getBean(key)).toBe(5);
        expect(applicationContext.getBean(key2)).toBe(12);
    });

    it("inject by key without factory", () => {
        const key = DependencyToken.create<number>("key", {componentType: ComponentType.Prototype});

        expect(() => {
            applicationContext.getBean(key);
        }).toThrowError("Factory for key not found.");
    });

    it("inject by key", () => {
        const key = DependencyToken.create<string>("key");
        const key2 = DependencyToken.create<string>("key2");
        const key3 = DependencyToken.create<b>("key3");

        class Item {
            a: string;
            constructor(a: string) {
                this.a = a;
            }
        }

        take(key).setFactory(() => "datata");
        take(key2).setFactory(() => "datata22");
        take(key3).setFactory(() => new b());
        take(key3).setFactory(() => new b());
        take(Item).setFactory((context) => new Item(context.getBean(key) + context.getBean(key2)));
        take(Item).setType(ComponentType.Singleton);

        expect(applicationContext.getBean(Item).a).toBe("datatadatata22");
        expect(applicationContext.getBean(Item)).toBe(applicationContext.getBean(Item));

        @component
        class a {
            test = "sa";

            constructor(@type(key) data: string, @type(key2) data2: string) {
                expect(data).toBe("datata");
                expect(data2).toBe("datata22");
            }

            @postConstruct
            post(@type(key3) data: b, item: Item) {
                expect(data instanceof  b).toBe(true);
                expect(item.a).toBe("datatadatata22");
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


        const key = DependencyToken.create<Object>("key3", {
            scope: ticket
        });

        take(key).setFactory(() => new Object());

        @component
        @scope(ticket)
        class Ticket {
            idTicket: number = 10;

            @autowired
            applicationContext!: ApplicationContext;

            @autowired
            componentContext!: ComponentContext

            @autowired
            a!: a;

            constructor(context: ApplicationContext, componentContext: ComponentContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context.getBean(key)).toBe(context.getBean(key));
                expect(context).toBe(this.applicationContext);
                expect(componentContext.getBean(ApplicationContext)).toBe(this.applicationContext);
                expect(componentContext).toBe(this.componentContext);
            }

            @postConstruct
            post(context: ApplicationContext, componentContext: ComponentContext) {
                expect(context).not.toBe(applicationContext);
                expect(context.getBean(TicketData)).toBe(context.getBean(TicketData));
                expect(context.getBean(key)).toBe(context.getBean(key));
                expect(context).toBe(this.applicationContext);
                expect(applicationContext.getBean(a)).toBe(this.a);
                expect(componentContext.getBean(ApplicationContext)).toBe(this.applicationContext);
                expect(componentContext).toBe(this.componentContext);
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
            @autowired c2!: C;
        }

        @component
        class AComponent extends A {
            c3: C;
            c4!: C;

            constructor(c3: C, context: ComponentContext) {
                super();
                this.c3 = c3;
                expect(context.getBean(C)).toBe(c3);
            }

            @postConstruct
            post(c4: C) {
                this.c4 = c4;
            }
        }

        it("test1", () => {
            let context = getBaseApplicationContext();
            const oldB = context.getBean(AComponent).b;
            const oldC = context.getBean(AComponent).c;

            const a = new A();
            expect(a.c).toBe(a.c2);

            expect(context.getBean(AComponent).b).toBe(oldB);
            expect(context.getBean(AComponent).c).toBe(context.getBean(AComponent).c2);
            expect(context.getBean(AComponent).c).toBe(context.getBean(AComponent).c3);
            expect(context.getBean(AComponent).c).toBe(context.getBean(AComponent).c4);

            expect(context.getBean(B)).toBe(oldB);
            expect(context.getBean(AComponent).c).toBe(oldC);
            expect(context.getBean(C)).not.toBe(oldC);

            destroyContext();
            context = getBaseApplicationContext();
            expect(context.getBean(AComponent).b).not.toBe(oldB);
            expect(context.getBean(B)).not.toBe(oldB);
            expect(context.getBean(AComponent).c).not.toBe(oldC);
            expect(context.getBean(C)).not.toBe(oldC);
        });

        it("overriden constructor", () => {

            @component
            class Omg {
                constructor() {
                }
            }

            @component
            class Wtf {
                constructor() {
                }
            }

            @component
            class Base {
                constructor(_omg: Omg, _omg2: Omg) {
                    expect(arguments.length).toBe(2);
                }
            }

            @component
            class Child extends Base {
                constructor(_omgd: Wtf) {
                    expect(arguments.length).toBe(1);
                    super(new Omg(), new Omg());
                }
            }

            applicationContext.getBean(Base);
            applicationContext.getBean(Child);
        })
    });

    describe("intrfaces tests", () => {
        interface F {
            x: number;
            f: F;
        }
        const f = DependencyToken.create<F>("f");

        @component
        class A implements F {
            x: number = 10;
            h: number = 20;
            @autowired
            @type(f)
            f!: F;
        }

        take(f).bindTo(A);

        it("test1", () => {
            expect(applicationContext.getBean(f).x).toBe(10)
            expect(applicationContext.getBean(f).f).toBe(applicationContext.getBean(f))
        });
    });
});