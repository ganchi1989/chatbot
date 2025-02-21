"use client";

import type { Attachment, Message } from "ai";
import { useChat } from "ai/react";

import useSWR, { useSWRConfig } from "swr";
import { PdfViewer } from "@/components/pdf-viewer";
import { useState, useCallback } from "react";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/src/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Block } from "./block";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { VisibilityType } from "./visibility-selector";
import { useBlockSelector } from "@/hooks/use-block";
import { toast } from "sonner";

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const togglePdf = useCallback(() => setIsPdfOpen((prev) => !prev), []);

  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate("/api/history");
    },
    onError: (error) => {
      toast.error("An error occured, please try again!");
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <>
      <div
        className={`flex ${
          isPdfOpen ? "flex-col md:flex-row" : "flex-col"
        } min-w-0 h-dvh bg-background`}
      >
        <div
          className={`flex flex-col min-w-0 ${
            isPdfOpen ? "md:w-1/2" : "w-full"
          } flex-grow`}
        >
          <ChatHeader
            chatId={id}
            selectedModelId={selectedChatModel}
            selectedVisibilityType={selectedVisibilityType}
            isReadonly={isReadonly}
            isPdfOpen={isPdfOpen}
            onTogglePdf={togglePdf}
          />

          <Messages
            chatId={id}
            isLoading={isLoading}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isBlockVisible={isBlockVisible}
          />

          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            )}
          </form>
        </div>

        {isPdfOpen && (
          <div
            className={` ${
              isPdfOpen ? "md:w-1/2" : "w-full"
            } relative border-l  min-h-[50vh]`} // Added min-h-[50vh]
            style={{
              height: isPdfOpen ? "calc(100dvh - 80px)" : "auto",
              maxHeight: "calc(100dvh - 80px)",
            }}
          >
            <PdfViewer onClose={togglePdf} />
          </div>
        )}
      </div>
      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
