// Spustí lokálně testy z GA matrix v .github/workflows/tests.yml
// usage: npm run test:ci [-- <filter>] [--ci]
//   <filter> - substring match na "package/script", např. "es6", "jest" nebo "ironbean/test:es5"
//   --ci     - npm ci místo npm install (čistá instalace jako na GA)
const fs = require("fs");
const path = require("path");
const {execSync} = require("child_process");

const root = path.join(__dirname, "..");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/tests.yml"), "utf8");

const args = process.argv.slice(2);
const cleanInstall = args.includes("--ci");
const filter = args.find(a => !a.startsWith("--"));

// parse flow-style include rows: - {package: ironbean, script: test:es5, node-version: 16.x}
const rows = [...workflow.matchAll(/-\s*\{([^}]*)\}/g)].map(match => {
    const row = {};
    for (const part of match[1].split(",")) {
        const index = part.indexOf(":");
        row[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    }
    return row;
});

// group by package, install + build jednou per package
const packages = new Map();
for (const row of rows) {
    if (filter !== undefined && !`${row.package}/${row.script}`.includes(filter)) {
        continue;
    }
    if (!packages.has(row.package)) {
        packages.set(row.package, []);
    }
    packages.get(row.package).push(row.script);
}

if (packages.size === 0) {
    console.error(`no matrix rows match filter "${filter}"`);
    process.exit(1);
}

function run(command, cwd) {
    console.log(`\n> [${path.basename(cwd)}] ${command}`);
    execSync(command, {cwd, stdio: "inherit"});
}

const failed = [];
for (const [pkg, scripts] of packages) {
    const cwd = path.join(root, "packages", pkg);
    run(cleanInstall ? "npm ci" : "npm install", cwd);
    run("npm run build", cwd);
    for (const script of scripts) {
        // fail-fast: false jako na GA - pokračujeme a failures vypíšeme na konci
        try {
            run(`npm run ${script}`, cwd);
        } catch (e) {
            failed.push(`${pkg}/${script}`);
        }
    }
}

if (failed.length > 0) {
    console.error(`\nfailed: ${failed.join(", ")}`);
    process.exit(1);
}
console.log("\nall passed");
