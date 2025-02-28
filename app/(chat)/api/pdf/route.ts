import { auth } from "@clerk/nextjs/server";
import { getPdfByChatId } from "@/src/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const pdf = await getPdfByChatId({ chatId });

    if (!pdf) {
      return Response.json(null, { status: 200 });
    }

    return Response.json(pdf, { status: 200 });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
