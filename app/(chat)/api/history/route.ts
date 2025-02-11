import { auth } from "@clerk/nextjs/server";
import { getChatsByUserId } from "@/src/queries";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: userId! });
  return Response.json(chats);
}
