import ArticleEditorPage from "../../_components/article-editor-page";

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;

  return <ArticleEditorPage articleId={resolvedParams.id} />;
}
