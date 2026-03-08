import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean-react-router

React Router integration for ironbean — provides a scoped \`ApplicationContext\` per route.

## Installation

\`\`\`sh
npm install --save ironbean ironbean-react ironbean-react-router
\`\`\`

## Usage

Wrap your routes with \`IronbeanRoute\` to give each route its own isolated dependency injection context.

\`\`\`typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IronbeanRoute } from "ironbean-react-router";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<IronbeanRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
\`\`\`

Components inside an \`IronbeanRoute\` can use \`useBean\` from \`ironbean-react\` and will receive dependencies scoped to that route's context.

## Why scoped contexts?

Route-level scoping means that route-specific singletons (e.g. a form state service, a page-level data cache) are automatically destroyed when the user navigates away. This prevents memory leaks and stale state between routes without any manual cleanup.
`;

export default function IronbeanReactRouterPage() {
  return <MarkdownContent content={content} />;
}
