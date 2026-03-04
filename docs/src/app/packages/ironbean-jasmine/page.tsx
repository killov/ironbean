import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean-jasmine

Jasmine integration for ironbean. Uses the same \`TestingContext\` core as **ironbean-jest** — the entire API (\`getMock\`, \`getBeanWithMocks\`, \`setMock\`, \`setMockFactory\`, \`enableMock\`, \`disableMock\`, \`createOrGetParentContext\`, …) works identically. The only difference is the mock type: Jasmine uses \`SpyObj<T>\` instead of \`SpyObject<T>\`.

See [ironbean-jest](/packages/ironbean-jest) for full API documentation.

## Installation

\`\`\`sh
npm install --save-dev ironbean-jasmine
\`\`\`

## Basic usage

\`\`\`typescript
import { getBaseJasmineTestingContext } from "ironbean-jasmine";
import { destroyContext } from "ironbean";

describe("OrderService", () => {
    afterEach(() => destroyContext());

    it("places an order", () => {
        const ctx = getBaseJasmineTestingContext();

        const service = ctx.getBeanWithMocks(OrderService);
        const dbMock  = ctx.getMock(Database); // jasmine.SpyObj<Database>

        dbMock.save.and.returnValue(true);
        expect(service.placeOrder({ item: "book" })).toBe(true);
        expect(dbMock.save).toHaveBeenCalledWith({ item: "book" });
    });
});
\`\`\`

## Mocking methods

Mocks are \`jasmine.SpyObj<T>\` — all methods are Jasmine spies:

\`\`\`typescript
const mock = ctx.getMock(Database);

mock.save.and.returnValue(true);
mock.save.and.returnValues(true, false);
mock.save.and.callFake((data) => data.id > 0);

expect(mock.save).toHaveBeenCalledTimes(1);
\`\`\`

## Mocking getters

Use \`getPropertyDescriptor\` to access getter spies — same helper as in ironbean-jest:

\`\`\`typescript
import { getBaseJasmineTestingContext, getPropertyDescriptor } from "ironbean-jasmine";

const mock = ctx.getMock(UserService);

getPropertyDescriptor(mock, "currentUser").get.and.returnValue({ id: 42 });
expect(mock.currentUser.id).toBe(42);
\`\`\`

Inherited getters are mocked automatically across the full prototype chain.

## How automocking works

| Dependency | Mock strategy |
|---|---|
| \`@component\` class | Prototype chain traversed; methods + getters/setters → \`jasmine.createSpyObj\` |
| \`DependencyToken\` (unknown) | \`Proxy\` — lazily creates \`jasmine.createSpy()\` for any accessed property |
| \`DependencyToken\` with \`.setClassType(Cls)\` | Delegates to \`mockClass\` with the specified class |

## Changelog

### 1.0.1
- Support \`DependencyToken\` for \`getMock()\`
- Support for \`mockUnknown()\`
`;

export default function IronbeanJasminePage() {
  return <MarkdownContent content={content} />;
}
