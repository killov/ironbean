import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean-jest

Jest integration for ironbean. Provides \`getBaseJestTestingContext()\` which returns a \`TestingContext\` where every \`@component\` is automatically mocked.

> The \`TestingContext\` API documented here (getMock, getBeanWithMocks, setMock, …) is **shared with ironbean-jasmine** — only the mock type differs.

## Installation

\`\`\`sh
npm install --save-dev ironbean-jest
\`\`\`

## Basic usage

\`\`\`typescript
import { getBaseJestTestingContext } from "ironbean-jest";
import { destroyContext } from "ironbean";

describe("OrderService", () => {
    afterEach(() => destroyContext());

    it("places an order", () => {
        const ctx = getBaseJestTestingContext();

        const service = ctx.getBeanWithMocks(OrderService); // real instance
        const dbMock  = ctx.getMock(Database);              // auto-generated mock

        dbMock.save.mockReturnValue(true);
        expect(service.placeOrder({ item: "book" })).toBe(true);
        expect(dbMock.save).toHaveBeenCalledWith({ item: "book" });
    });
});
\`\`\`

## getBean vs getBeanWithMocks

| Method | Returns |
|---|---|
| \`ctx.getBean(Cls)\` | Mocked instance — all methods are \`jest.fn()\` |
| \`ctx.getBeanWithMocks(Cls)\` | **Real** instance of \`Cls\`, with its dependencies auto-mocked |

\`\`\`typescript
const service = ctx.getBeanWithMocks(OrderService);
// OrderService is real; Database, Mailer etc. injected as mocks
\`\`\`

## getMock

Returns the \`SpyObject<T>\` for a dependency. All methods are \`jest.fn()\`, all getters/setters are jest spies.

\`\`\`typescript
const mock = ctx.getMock(Database);

mock.save.mockReturnValue(true);
mock.save.mockResolvedValue({ id: 1 });
mock.save.mockImplementation((data) => data.id > 0);

expect(mock.save).toHaveBeenCalledTimes(1);
\`\`\`

## Mocking getters

Use the exported \`getPropertyDescriptor\` helper to access spies for getter/setter properties:

\`\`\`typescript
import { getBaseJestTestingContext, getPropertyDescriptor } from "ironbean-jest";

const mock = ctx.getMock(UserService);

getPropertyDescriptor(mock, "currentUser").get.mockReturnValue({ id: 42 });
expect(mock.currentUser.id).toBe(42);
\`\`\`

Inherited getters are mocked too — automocking traverses the entire prototype chain:

\`\`\`typescript
class Base {
    get status(): string { return "base"; }
}

@component
class Service extends Base {
    get name(): string { return "service"; }
}

const mock = ctx.getMock(Service);
getPropertyDescriptor(mock, "status").get.mockReturnValue("mocked-base");
getPropertyDescriptor(mock, "name").get.mockReturnValue("mocked");
\`\`\`

## Custom mock implementations

### setMockFactory

Provide a custom factory for a specific dependency:

\`\`\`typescript
class FakeDatabase extends Database {
    save(data: any) { return true; }
}

ctx.setMockFactory(Database, () => new FakeDatabase());
// also supports returning null:
ctx.setMockFactory(IOptional, () => null);
\`\`\`

### setMock

Use a \`@component\` subclass as the mock for a dependency. The subclass is fully instantiated with its own injected dependencies:

\`\`\`typescript
@component
class FakeDatabase extends Database {
    save(data: any) { return true; }
}

ctx.setMock(Database, FakeDatabase);

const service = ctx.getBeanWithMocks(OrderService);
expect(service.db).toBeInstanceOf(FakeDatabase);
\`\`\`

> The replacement class must be decorated with \`@component\`.

### enableMock / disableMock

All \`@component\` classes are auto-mocked by default. Opt individual classes out:

\`\`\`typescript
ctx.disableMock(CurrencyConverter); // use real implementation
ctx.enableMock(CurrencyConverter);  // re-enable auto-mock

// enableMock also works for classes without @component:
ctx.enableMock(ThirdPartyClass);
\`\`\`

## Testing scoped dependencies

\`\`\`typescript
import { Scope, scope, component } from "ironbean";

const RequestScope = Scope.create("request");

@component @scope(RequestScope)
class RequestHandler { /* ... */ }

const ctx = getBaseJestTestingContext();
const reqCtx = ctx.createOrGetParentContext(RequestScope);

reqCtx.setMockFactory(RequestHandler, () => new RequestHandler());
const handler = reqCtx.getBean(RequestHandler);
\`\`\`

## SpyObject type

\`\`\`typescript
type SpyObject<T> = T & {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R
        ? jest.MockInstance<R, A>
        : T[K];
};
\`\`\`

## How automocking works

| Dependency | Mock strategy |
|---|---|
| \`@component\` class | Prototype chain traversed; methods → \`jest.fn()\`, getters/setters → jest spies |
| \`DependencyToken\` (unknown) | \`Proxy\` — lazily creates \`jest.fn()\` for any accessed property |
| \`DependencyToken\` with \`.setClassType(Cls)\` | Delegates to \`mockClass\` with the specified class |

## Changelog

### 1.0.1
- Fixed automocking with inheritance
`;

export default function IronbeanJestPage() {
  return <MarkdownContent content={content} />;
}
