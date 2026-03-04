import { MarkdownContent } from "@/components/MarkdownContent";

const content = `
# ironbean-ts-transformer

A TypeScript AST transformer that injects \`reflect-metadata\` imports at compile time, enabling ironbean's dependency resolution without requiring \`emitDecoratorMetadata\` everywhere.

## Installation

\`\`\`sh
npm install --save-dev ironbean-ts-transformer
\`\`\`

## Setup with ts-jest

Add the transformer to your Jest config:

\`\`\`js
// jest.config.js
module.exports = {
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                astTransformers: {
                    before: ["ironbean-ts-transformer"],
                },
            },
        ],
    },
};
\`\`\`

## Setup with ts-patch

Install [ts-patch](https://github.com/nonara/ts-patch) and add the plugin to \`tsconfig.json\`:

\`\`\`json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "ironbean-ts-transformer" }
    ]
  }
}
\`\`\`

## What it does

The transformer runs over the TypeScript AST before compilation and:

1. Detects files that use ironbean decorators (\`@component\`, \`@autowired\`, etc.)
2. Automatically prepends \`import "reflect-metadata"\` to those files
3. Emits constructor parameter type metadata needed for dependency resolution

This means you get ironbean's full DI capabilities without manually importing \`reflect-metadata\` in every file or relying on \`emitDecoratorMetadata\` being enabled globally.
`;

export default function IronbeanTsTransformerPage() {
  return <MarkdownContent content={content} />;
}
