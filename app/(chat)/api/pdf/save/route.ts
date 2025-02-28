import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { savePdf, updatePdf } from "@/src/queries";
import { generateUUID } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { url, chatId } = await request.json();

    if (!url || !chatId) {
      return NextResponse.json(
        { error: "URL and chatId are required" },
        { status: 400 }
      );
    }

    const id = generateUUID();
    await savePdf({
      id,
      url,
      chatId,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving PDF:", error);
    return NextResponse.json(
      { error: "Failed to save PDF" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session || !session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id, url, chatId } = await request.json();

    if (!id || !url || !chatId) {
      return NextResponse.json(
        { error: "ID, URL and chatId are required" },
        { status: 400 }
      );
    }

    await updatePdf({
      id,
      url,
      chatId,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating PDF:", error);
    return NextResponse.json(
      { error: "Failed to update PDF" },
      { status: 500 }
    );
  }
}