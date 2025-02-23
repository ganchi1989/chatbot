"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import type { Attachment, Message } from "ai";
import { useChat } from "ai/react";

import useSWR, { useSWRConfig } from "swr";
import { PdfViewer } from "@/components/pdf-viewer";

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

  // Create a ref for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
    });
  }, [messages]);

  return (
    <>
      <div
        className={`flex ${
          isPdfOpen ? "flex-col md:flex-row" : "flex-col"
        } min-w-0 min-h-screen bg-background`}
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

          {/* Messages container that grows and scrolls */}
          <div className="flex-grow overflow-y-auto">
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
            {/* Anchor element for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form that sticks to the bottom */}
          {!isReadonly && (
            <div className="sticky bottom-0 bg-background px-4 pb-1 md:pb-4">
              <form className="flex mx-auto gap-2 w-full md:max-w-3xl">
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
              </form>
            </div>
          )}
        </div>

        {isPdfOpen && (
          <div
            className={`${
              isPdfOpen ? "md:w-1/2" : "w-full"
            } relative border-l min-h-[50vh]`} // Added min-h-[50vh]
            style={{
              height: isPdfOpen ? "calc(100% - 80px)" : "auto",
              maxHeight: "calc(100% - 80px)",
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
