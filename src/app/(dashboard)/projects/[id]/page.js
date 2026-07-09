import ProjectEditorPage from "../../_components/project-editor-page";

export default async function ProjectPage({ params }) {
  const resolvedParams = await params;

  return <ProjectEditorPage projectId={resolvedParams.id} />;
}
