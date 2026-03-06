import Link from "next/link";
import { notFound } from "next/navigation";

const packages = {
  "ironbean": {
    name: "ironbean",
    description: "A dependency injection container for TypeScript and JavaScript.",
  },
  "ironbean-react": {
    name: "ironbean-react",
    description: "React bindings for ironbean dependency injection.",
  },
  "ironbean-jest": {
    name: "ironbean-jest",
    description: "Jest integration for ironbean for easier testing.",
  },
  "ironbean-jasmine": {
    name: "ironbean-jasmine",
    description: "Jasmine integration for ironbean.",
  },
  "ironbean-react-router": {
    name: "ironbean-react-router",
    description: "React Router integration with ironbean.",
  },
  "ironbean-ts-transformer": {
    name: "ironbean-ts-transformer",
    description: "TypeScript AST transformer for ironbean to enable automatic dependency injection.",
  }
};

export default function PackagePage({ params }: { params: { package: string } }) {
  const pkg = packages[params.package as keyof typeof packages];
  
  if (!pkg) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-8 inline-block">
          &larr; Back to home
        </Link>
        
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-white">
            {pkg.name}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            {pkg.description}
          </p>
        </header>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h2>Documentation</h2>
          <p>Documentation for {pkg.name} is coming soon.</p>
        </div>
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(packages).map((pkg) => ({
    package: pkg,
  }));
}
