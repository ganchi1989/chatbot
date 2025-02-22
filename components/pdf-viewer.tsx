"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { useWindowSize } from "usehooks-ts";
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// Set up the worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
// Lector imports for PDF reading, zoom, and page navigation
import {
  Root,
  Pages,
  Page as LectorPage,
  CanvasLayer,
  TextLayer,
  ZoomIn,
  ZoomOut,
  CurrentZoom,
} from "@unriddle-ai/lector";

// Import your custom navigation buttons component (uses lector hooks)
import PageNavigationButtons from "./PageNavigationButtons";
import { CancelIcon, UploadIcon } from "@/components/icons";

interface ViewerState {
  pdfFile: File | null;
  pdfUrl: string | null;
}

export function PdfViewer({ onClose }: { onClose: () => void }) {
  const [viewerState, setViewerState] = useState<ViewerState>({
    pdfFile: null,
    pdfUrl: null,
  });

  const { width } = useWindowSize();
  const buttonSize = width < 768 ? "sm" : "lg";

  // Clean up object URL when pdfFile changes
  useEffect(() => {
    return () => {
      if (viewerState.pdfUrl) {
        URL.revokeObjectURL(viewerState.pdfUrl);
      }
    };
  }, [viewerState.pdfUrl]);

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file && file.type === "application/pdf") {
      // Revoke any previous URL before creating a new one.
      if (viewerState.pdfUrl) {
        URL.revokeObjectURL(viewerState.pdfUrl);
      }
      const url = URL.createObjectURL(file);
      setViewerState({
        pdfFile: file,
        pdfUrl: url,
      });
    } else if (file) {
      alert("Please upload a valid PDF file.");
    }
  };

  // The updated pdfBody now uses lector instead of react‑pdf.
  const pdfBody = (
    <>
      {viewerState.pdfUrl ? (
        <Root
          source={viewerState.pdfUrl}
          className="w-full h-full border overflow-hidden rounded-lg"
          loader={<div className="p-4">Loading...</div>}
        >
          <div className="bg-gray-100 border-b p-1 flex items-center justify-center text-sm text-gray-600 gap-2">
            <ZoomOut className="px-3 py-1 -mr-2 text-gray-900">-</ZoomOut>
            <CurrentZoom className="bg-white rounded-full px-3 py-1 border text-center w-16" />
            <ZoomIn className="px-3 py-1 -ml-2 text-gray-900">+</ZoomIn>
          </div>

          {/* PDF Pages */}
          <Pages>
            <LectorPage>
              <CanvasLayer />
              <TextLayer />
            </LectorPage>
          </Pages>
          <PageNavigationButtons />
        </Root>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6">
          <FileUpload onChange={handleFileUpload} />
        </div>
      )}
    </>
  );

  // Header with title and reupload/close buttons
  const viewerContent = (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                //size={buttonSize}
                onClick={onClose}
              >
                <CancelIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>

          {viewerState.pdfUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  //size={buttonSize}
                  className={cn(
                    "order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0 flex items-center text-gray-600 dark:text-gray-300 cursor-pointer"
                  )}
                  onClick={() => {
                    // Revoke URL when reuploading
                    if (viewerState.pdfUrl) {
                      URL.revokeObjectURL(viewerState.pdfUrl);
                    }
                    setViewerState({ pdfFile: null, pdfUrl: null });
                  }}
                >
                  <UploadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {pdfBody}
    </div>
  );

  if (width < 768) {
    return (
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DrawerContent className="flex flex-col h-full bg-white dark:bg-gray-900">
          <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
            <DrawerTitle className="font-sans font-semibold text-gray-800 dark:text-gray-100">
              PDF Viewer
            </DrawerTitle>
            <DrawerClose
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300"
            />
          </DrawerHeader>
          {pdfBody}
        </DrawerContent>
      </Drawer>
    );
  }

  return viewerContent;
}

export default PdfViewer;
