"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    category: "Core",
    items: [
      {
        name: "ironbean",
        path: "/packages/ironbean",
        sections: [
          { name: "Installation", anchor: "#installation" },
          { name: "Class component", anchor: "#class-component" },
          { name: "Dependency token", anchor: "#dependency-token" },
          { name: "ApplicationContext", anchor: "#applicationcontext" },
          { name: "Injection types", anchor: "#injection-types" },
          { name: "Lazy injection", anchor: "#lazy-injection" },
          { name: "Collection injection", anchor: "#collection-injection" },
          { name: "Scopes", anchor: "#scopes" },
          { name: "Factory classes", anchor: "#factory-classes" },
          { name: "Configuration", anchor: "#configuration" },
          { name: "Changelog", anchor: "#changelog" },
        ],
      },
    ],
  },
  {
    category: "React",
    items: [
      {
        name: "ironbean-react",
        path: "/packages/ironbean-react",
        sections: [
          { name: "Installation", anchor: "#installation" },
          { name: "useBean", anchor: "#usebean" },
          { name: "ContextProvider", anchor: "#contextprovider" },
          { name: "withContext", anchor: "#withcontext" },
          { name: "Changelog", anchor: "#changelog" },
        ],
      },
    ],
  },
  {
    category: "Testing",
    items: [
      {
        name: "ironbean-jest",
        path: "/packages/ironbean-jest",
        sections: [
          { name: "Installation", anchor: "#installation" },
          { name: "Basic usage", anchor: "#basic-usage" },
          { name: "getBean vs getBeanWithMocks", anchor: "#getbean-vs-getbeanwithmocks" },
          { name: "getMock", anchor: "#getmock" },
          { name: "Mocking getters", anchor: "#mocking-getters" },
          { name: "Custom mocks", anchor: "#custom-mock-implementations" },
          { name: "Scoped dependencies", anchor: "#testing-scoped-dependencies" },
          { name: "Changelog", anchor: "#changelog" },
        ],
      },
      {
        name: "ironbean-jasmine",
        path: "/packages/ironbean-jasmine",
        sections: [
          { name: "Installation", anchor: "#installation" },
          { name: "Basic usage", anchor: "#basic-usage" },
          { name: "Mocking methods", anchor: "#mocking-methods" },
          { name: "Mocking getters", anchor: "#mocking-getters" },
          { name: "How mocking works", anchor: "#how-mocking-works" },
          { name: "Changelog", anchor: "#changelog" },
        ],
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 sticky top-[65px] self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-2">
      <div className="space-y-5">
        {nav.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {group.category}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`block rounded-lg px-2 py-1.5 text-sm font-mono transition-colors ${
                        active
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {item.name}
                    </Link>

                    {active && (
                      <ul className="mt-0.5 mb-1 ml-3 border-l border-zinc-200 dark:border-zinc-700 pl-3 space-y-0.5">
                        {item.sections.map((section) => (
                          <li key={section.anchor}>
                            <a
                              href={section.anchor}
                              className="block py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight"
                            >
                              {section.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
