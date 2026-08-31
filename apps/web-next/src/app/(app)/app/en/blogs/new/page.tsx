import { ContentGenerator } from "@/components/content/content-generator";

export default function NewBlogPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Blog Post</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure your target keywords and settings to write a new post.</p>
      </div>
      <ContentGenerator redirectBase="/app/en/blogs" />
    </div>
  );
}
