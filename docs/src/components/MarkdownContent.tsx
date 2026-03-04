import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import CopyCodeButtons from "./CopyCodeButtons";

export async function MarkdownContent({ content }: { content: string }) {
  const html = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: {
        dark: "github-dark-dimmed",
        light: "github-light",
      },
      keepBackground: true,
    })
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(content);

  return (
    <>
      <div
        className="prose prose-zinc dark:prose-invert max-w-none
          prose-headings:scroll-mt-24
          prose-h1:text-2xl prose-h1:font-black prose-h1:mb-2
          prose-h2:text-lg prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-3
          prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed
          prose-li:text-zinc-600 dark:prose-li:text-zinc-400
          prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100
          prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: html.toString() }}
      />
      <CopyCodeButtons />
    </>
  );
}
