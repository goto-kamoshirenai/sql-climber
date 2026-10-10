import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const metadata: Metadata = { title: "学習リソース" };

const resourcesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      lead: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          by: z.string(),
          note: z.string(),
          url: z.url().optional(),
          /** アフィリエイトリンクは安全に載せられる場合だけ true にする */
          sponsored: z.boolean().optional(),
        }),
      ),
    }),
  ),
});

/** content/resources.json をビルド時に読む（静的ページ） */
async function loadResources() {
  const text = await readFile(path.join(process.cwd(), "content", "resources.json"), "utf8");
  return resourcesSchema.parse(JSON.parse(text));
}

export default async function ResourcesPage() {
  const { categories } = await loadResources();
  const hasSponsored = categories.some((c) => c.items.some((i) => i.sponsored));

  return (
    <div className="page">
      <h1 className="page-title">学習リソース</h1>
      <p className="page-lead">この問題集の外へ足をのばすときの、地図とガイドブックです。</p>

      {categories.map((category) => (
        <section key={category.id} className="section" aria-labelledby={`res-${category.id}`}>
          <h2 id={`res-${category.id}`} className="section-title">
            {category.title}
          </h2>
          <p className="muted">{category.lead}</p>
          <ul className="resource-list">
            {category.items.map((item) => (
              <li key={item.title} className="resource">
                <p className="resource__title">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel={item.sponsored ? "sponsored noopener" : "noopener"}
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                  {item.sponsored && <span className="key-badge">広告</span>}
                </p>
                <p className="resource__by muted">{item.by}</p>
                <p className="resource__note">{item.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {hasSponsored && (
        <p className="muted section">
          「広告」と表示したリンクはアフィリエイトリンクです。購入されると運営者に紹介料が支払われることがあります。
        </p>
      )}
    </div>
  );
}
