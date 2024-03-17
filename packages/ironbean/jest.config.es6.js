/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          importHelpers: true,
          strict: false,
          strictPropertyInitialization: false,
          noUnusedLocals: false,
          noImplicitAny: false,
          noUnusedParameters: false,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: "ES6"
        },
      },
    ],
  },
}