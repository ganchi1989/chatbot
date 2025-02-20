import { generateUUID } from "@/lib/utils";
import { DataStreamWriter, tool } from "ai";
import { z } from "zod";

import { blockKinds, documentHandlersByBlockKind } from "@/lib/blocks/server";

interface CreateDocumentProps {
  userId: string;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ userId, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for a writing or content creation activity. This tool will call other functions that will generate the contents of the document based on the title, task, and the entire chat input.",
    parameters: z.object({
      title: z.string(),
      task: z.string(), // additional task content
      chat: z.string(), // <-- new parameter for full chat input (every character)
      kind: z.enum(blockKinds),
    }),
    execute: async ({ title, task, chat, kind }) => {
      const id = generateUUID();

      dataStream.writeData({
        type: "kind",
        content: kind,
      });

      dataStream.writeData({
        type: "id",
        content: id,
      });

      dataStream.writeData({
        type: "title",
        content: title,
      });

      dataStream.writeData({
        type: "task",
        content: task,
      });

      dataStream.writeData({
        type: "chat",
        content: chat,
      });

      dataStream.writeData({
        type: "clear",
        content: "",
      });

      const documentHandler = documentHandlersByBlockKind.find(
        (handler) => handler.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        task,
        chat, // <-- forward the complete user chat input
        dataStream,
        userId,
      });

      dataStream.writeData({ type: "finish", content: "" });

      return {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      };
    },
  });
