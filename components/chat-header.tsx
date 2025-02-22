"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

import { ModelSelector } from "@/components/model-selector";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, FileIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { VisibilityType, VisibilitySelector } from "./visibility-selector";

interface ChatHeaderProps {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isPdfOpen: boolean;
  onTogglePdf: () => void;
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  isPdfOpen,
  onTogglePdf,
}: ChatHeaderProps) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="sticky  z-10  flex top-0 bg-white dark:bg-black  py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-3 md:order-3 md:px-2 px-2 md:h-fit"
              onClick={onTogglePdf}
            >
              <FileIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open PDF</TooltipContent>
        </Tooltip>
      )}

      {/*
      Uncomment the following block if you wish to include the VisibilitySelector
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-4 md:order-4"
        />
      )} */}
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isPdfOpen === nextProps.isPdfOpen
);
