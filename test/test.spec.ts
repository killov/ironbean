import { autowired, component, getBaseApplicationContext, postConstruct} from "../src";

describe("test", () => {
    it("test 1", () => {
        @component
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a: a;
        }

        const applicationContext = getBaseApplicationContext();

        const ib1 = applicationContext.getBean(b);
        const ib2 = applicationContext.getBean(b);
        const ib3 = applicationContext.getBean(b);
        const ib4 = applicationContext.getBean(b);
        const ia1 = applicationContext.getBean(a);
        const ia2 = applicationContext.getBean(a);
        const ia3 = applicationContext.getBean(a);
        const ia4 = applicationContext.getBean(a);

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
});