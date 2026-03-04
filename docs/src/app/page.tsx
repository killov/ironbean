import Link from "next/link";
import Image from "next/image";

const packages = [
  {
    category: "Core",
    items: [
      {
        name: "ironbean",
        description: "Dependency injection container for TypeScript and JavaScript.",
        path: "/packages/ironbean",
        badge: "core",
      },
    ],
  },
  {
    category: "React",
    items: [
      {
        name: "ironbean-react",
        description: "React hooks and components for ironbean DI.",
        path: "/packages/ironbean-react",
        badge: "react",
      },
    ],
  },
  {
    category: "Testing",
    items: [
      {
        name: "ironbean-jest",
        description: "Jest integration with automatic mocking via jest.fn().",
        path: "/packages/ironbean-jest",
        badge: "testing",
      },
      {
        name: "ironbean-jasmine",
        description: "Jasmine integration with automatic spy object generation.",
        path: "/packages/ironbean-jasmine",
        badge: "testing",
      },
    ],
  },
];

const badgeColors: Record<string, string> = {
  core: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  react: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  testing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Hero */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/logo.jpg`} alt="ironbean" width={280} height={280} className="mx-auto mb-6 rounded-3xl shadow-2xl shadow-blue-900/40" />
          <h1 className="text-6xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              ironbean
            </span>
            <br />
            <span className="text-zinc-900 dark:text-white text-5xl">ecosystem</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            A powerful, type-safe dependency injection framework for TypeScript —
            with seamless React, Jest, and Jasmine integrations.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 font-mono text-sm">
              <span className="text-zinc-400 select-none">$</span>
              <span className="text-zinc-900 dark:text-zinc-100">npm install ironbean</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/packages/ironbean"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Get started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="https://github.com/killov/ironbean"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Packages */}
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-12">
        {packages.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-4">
              {group.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((pkg) => (
                <Link
                  key={pkg.name}
                  href={pkg.path}
                  className="group flex flex-col justify-between p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-mono text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {pkg.name}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[pkg.badge]}`}>
                        {pkg.badge}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    View docs
                    <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
