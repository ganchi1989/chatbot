import { auth } from "@clerk/nextjs/server";
import { getSuggestionsByDocumentId } from "@/src/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(suggestions, { status: 200 });
}
