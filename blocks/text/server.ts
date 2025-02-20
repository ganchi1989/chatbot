import { smoothStream, streamText } from "ai";
import { myProvider } from "@/lib/ai/models";
import { createDocumentHandler } from "@/lib/blocks/server";
import { updateDocumentPrompt } from "@/lib/ai/prompts";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, task, chat, dataStream }) => {
    let draftContent = "";

    // Combine title, task and full chat input into the prompt.
    const promptContent = `${title}\n\n${task || ""}\n\n${chat}`;
    console.log("Prompt content: ", promptContent);
    const { fullStream } = streamText({
      model: myProvider.languageModel("block-model"),
      system:
        "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: promptContent,
    });

    for await (const delta of fullStream) {
      const { type } = delta;
      if (type === "text-delta") {
        const { textDelta } = delta;
        draftContent += textDelta;
        dataStream.writeData({
          type: "text-delta",
          content: textDelta,
        });
      }
    }
    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.languageModel("block-model"),
      system: updateDocumentPrompt(document.content, "text"),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: "content",
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;
      if (type === "text-delta") {
        const { textDelta } = delta;
        draftContent += textDelta;
        dataStream.writeData({
          type: "text-delta",
          content: textDelta,
        });
      }
    }
    return draftContent;
  },
});
