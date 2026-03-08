const path = require('path');
const fs = require('fs');

module.exports = function (config) {
    const reactVersion = parseInt(require('./node_modules/react/package.json').version.split('.')[0]);

    // react-dom/client was added in React 18. For older versions, create a stub so
    // karma-typescript's browser-resolve doesn't fail when encountering require('react-dom/client').
    // The stub returns {}, so createRoot will be undefined, and the test code falls back to
    // legacy ReactDOM.render / unmountComponentAtNode.
    if (reactVersion < 18) {
        const clientStub = path.resolve('./node_modules/react-dom/client.js');
        if (!fs.existsSync(clientStub)) {
            fs.writeFileSync(clientStub, 'module.exports = {};\n');
        }
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
            }
        }
    });
};
