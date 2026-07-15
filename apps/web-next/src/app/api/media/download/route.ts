import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Fetch the asset server-side (server is not restricted by browser CORS)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote asset: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Determine filename
    const urlPath = new URL(url).pathname;
    const originalFilename = urlPath.substring(urlPath.lastIndexOf("/") + 1) || "asset";
    const filename = originalFilename.includes(".") ? originalFilename : `${originalFilename}.png`;

    // Return the file stream with attachment headers to force browser local download
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[DownloadProxy] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to download asset" }, { status: 500 });
  }
}
