import { ContentEditor } from "@/components/content/content-editor";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlogPage({ params }: PageProps) {
  const { id } = await params;
  return <ContentEditor id={id} backHref="/app/en/blogs" />;
}
