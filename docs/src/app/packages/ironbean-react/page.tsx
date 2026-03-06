import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean-react

React hooks and components for ironbean dependency injection.

## Installation

\`\`\`sh
npm install --save ironbean ironbean-react
\`\`\`

## useBean

A React hook that resolves a dependency from the ironbean container. Re-resolves when the context changes.

\`\`\`typescript
import { useBean } from "ironbean-react";

function TodoList() {
    const storage = useBean(ITodoStorage);
    const [todos, setTodos] = useState(() => storage.getAll());

    return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}
\`\`\`

## ContextProvider

Provides a custom \`ApplicationContext\` to a React subtree. Useful for scoping dependencies to part of the app.

\`\`\`typescript
import { ContextProvider } from "ironbean-react";
import { getBaseApplicationContext } from "ironbean";

const context = getBaseApplicationContext();

function App() {
    return (
        <ContextProvider context={context}>
            <TodoList />
        </ContextProvider>
    );
}
\`\`\`

## withContext

A higher-order component that wires ironbean's context into a class component so that constructor injection and \`@autowired\` work correctly inside it.

\`\`\`typescript
import { withContext } from "ironbean-react";
import { component, autowired } from "ironbean";

@withContext()
@component
class MyWidget extends React.Component {
    @autowired
    private service: MyService;

    render() {
        return <div>{this.service.getValue()}</div>;
    }
}
\`\`\`

> **Note:** For function components, \`useBean\` is the preferred approach.

## Changelog

### 1.0.2
- Support React 18

### 1.0.1
- Support \`DependencyToken\` for \`useBean\`
- \`useBean\` optimization for context changes
`;

export default function IronbeanReactPage() {
  return <MarkdownContent content={content} />;
}
