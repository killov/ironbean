module.exports = function (config) {
    config.set({
        frameworks: ["jasmine", "karma-typescript"],
        files: [
            "src/**/*.ts", // *.tsx for React Jsx
            "test/*.ts" // *.tsx for React Jsx
        ],
        preprocessors: {
            "*/**/*.ts": ["karma-typescript"]
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["ChromeHeadless"],
        karmaTypescriptConfig: {
            compilerOptions: {
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                jsx: "react",
                module: "commonjs",
                sourceMap: true,
                target: "ES5",
                lib: ["es2015", "dom" ],
                useDefineForClassFields: true
            }
        }
    });
};