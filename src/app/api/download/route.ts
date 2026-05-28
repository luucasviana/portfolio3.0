import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return new NextResponse("Missing file URL", { status: 400 });
    }

    // Fetch the private blob using the Vercel Blob SDK
    // This automatically leverages BLOB_READ_WRITE_TOKEN from env
    const result = await get(fileUrl, {
      access: "private",
    });

    if (!result) {
      return new NextResponse("File not found", { status: 404 });
    }

    if (result.statusCode !== 200) {
      return new NextResponse("Failed to stream file", { status: 500 });
    }

    const { stream, blob } = result;

    // Extract file name
    const filename = blob.pathname.split("/").pop() || "documento.pdf";

    // Stream the file back to the browser with proper content type and content-disposition
    return new Response(stream as any, {
      headers: {
        "Content-Type": blob.contentType || "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error("Secure Download API failed:", error);
    return new NextResponse(error.message || "Failed to download file", { status: 500 });
  }
}
