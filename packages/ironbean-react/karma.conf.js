module.exports = function (config) {
    const reactVersion = parseInt(require('./node_modules/react/package.json').version.split('.')[0]);

    // Shim modules that don't exist in certain React versions so bundler doesn't fail:
    // - react-dom/client was added in React 18
    // - react-dom/test-utils was removed in React 19
    const bundlerBrowser = {};
    if (reactVersion < 18) {
        bundlerBrowser['react-dom/client'] = false;
    }
    if (reactVersion >= 19) {
        bundlerBrowser['react-dom/test-utils'] = false;
    }

    config.set({
        frameworks: ["jasmine", "karma-typescript"],
        files: [
            "./src/*.ts", // *.tsx for React Jsx
            "./test/*.tsx" // *.tsx for React Jsx
        ],
        preprocessors: {
            "*/*.ts": ["karma-typescript"],
            "*/*.tsx": ["karma-typescript"]
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["ChromeHeadless"],
        karmaTypescriptConfig: {
            compilerOptions: {
                emitDecoratorMetadata: true,
                esModuleInterop: true,
                target: "ES5",
                lib: ["es2015", "dom"]
            },
            bundlerOptions: {
                browser: bundlerBrowser
            }
        }
    });
};