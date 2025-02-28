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
import { useParams } from "next/navigation";
import { toast } from "sonner";

// Set up the worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
// Lector imports for PDF reading, zoom, and page navigation
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  ZoomIn,
  ZoomOut,
  CurrentZoom,
} from "@unriddle-ai/lector";

// Import your custom navigation buttons component (uses lector hooks)
import PageNavigationButtons from "./PageNavigationButtons";
import { CancelIcon, LoaderIcon, UploadIcon } from "@/components/icons";

interface ViewerState {
  pdfFile: File | null;
  pdfUrl: string | null;
}

// Key for storing temporary PDF in localStorage
const TEMP_PDF_KEY = "temp_pdf_url";

export function PdfViewer({ onClose }: { onClose: () => void }) {
  const [viewerState, setViewerState] = useState<ViewerState>({
    pdfFile: null,
    pdfUrl: null,
  });
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { width } = useWindowSize();
  const buttonSize = width < 768 ? "sm" : "lg";
  const params = useParams();
  const chatId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  // Convert remote URL to local blob URL for better rendering
  useEffect(() => {
    if (!viewerState.pdfUrl) {
      setLocalPdfUrl(null);
      return;
    }

    // If it's already a blob URL, use it directly
    if (viewerState.pdfUrl.startsWith("blob:")) {
      setLocalPdfUrl(viewerState.pdfUrl);
      return;
    }

    // Otherwise, fetch the remote PDF and create a local blob URL
    const fetchPdf = async () => {
      setIsLoading(true);
      try {
        // Ensure pdfUrl is not null before fetching
        if (!viewerState.pdfUrl) {
          toast.error("PDF URL is missing");
          setIsLoading(false);
          return;
        }
        const response = await fetch(viewerState.pdfUrl);
        if (!response.ok) {
          toast.error("Failed to load PDF");
          setIsLoading(false);
          return;
        }

        const pdfBlob = await response.blob();
        const localUrl = URL.createObjectURL(pdfBlob);
        setLocalPdfUrl(localUrl);
        setIsLoading(false);
      } catch (error) {
        console.error("Error converting remote PDF to local:", error);
        toast.error("Failed to process PDF");
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [viewerState.pdfUrl]);

  // Load PDF from database when component mounts
  useEffect(() => {
    const loadPdf = async () => {
      // If we have a chatId, try to load from database
      if (chatId) {
        try {
          const response = await fetch(`/api/pdf?chatId=${chatId}`);

          if (!response.ok) {
            console.error("Failed to fetch PDF:", response.status);
            return;
          }

          const pdfData = await response.json();

          if (pdfData && pdfData.url) {
            setViewerState({
              pdfFile: null,
              pdfUrl: pdfData.url,
            });
            return;
          }
        } catch (error) {
          console.error("Error loading PDF from database:", error);
        }
      }

      // If no chatId or no PDF in database, check localStorage for temp PDF
      if (typeof window !== "undefined") {
        const tempPdfUrl = localStorage.getItem(TEMP_PDF_KEY);
        if (tempPdfUrl) {
          setViewerState({
            pdfFile: null,
            pdfUrl: tempPdfUrl,
          });
        }
      }
    };

    loadPdf();
  }, [chatId]);

  // Save PDF to database when chatId becomes available
  useEffect(() => {
    const saveTempPdfToDatabase = async () => {
      // Only proceed if we have both a chatId and a temporary PDF URL
      if (chatId && viewerState.pdfUrl && typeof window !== "undefined") {
        const tempPdfUrl = localStorage.getItem(TEMP_PDF_KEY);

        // If the current PDF is from localStorage, save it to the database
        if (tempPdfUrl && tempPdfUrl === viewerState.pdfUrl) {
          try {
            const saveResponse = await fetch("/api/pdf/save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url: tempPdfUrl, chatId }),
            });

            if (saveResponse.ok) {
              // Clear from localStorage after successful save
              localStorage.removeItem(TEMP_PDF_KEY);
              toast.success("PDF associated with this chat");
            }
          } catch (error) {
            console.error("Error saving temporary PDF to database:", error);
          }
        }
      }
    };

    saveTempPdfToDatabase();
  }, [chatId, viewerState.pdfUrl]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (localPdfUrl && localPdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPdfUrl);
      }
    };
  }, [localPdfUrl]);

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (file && file.type === "application/pdf") {
      try {
        // First upload the file to Vercel Blob
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          toast.error(errorData.error || "Failed to upload PDF");
          return;
        }

        const { url } = await uploadResponse.json();

        // If we have a chatId, save to database
        if (chatId) {
          // Check if a PDF already exists for this chat
          const checkResponse = await fetch(`/api/pdf?chatId=${chatId}`);
          const existingPdf = checkResponse.ok
            ? await checkResponse.json()
            : null;

          // Use PUT method to update if PDF exists, otherwise POST to create new
          const method = existingPdf && existingPdf.id ? "PUT" : "POST";

          const saveResponse = await fetch("/api/pdf/save", {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              chatId,
              // Include the existing PDF ID if we're updating
              ...(existingPdf && existingPdf.id ? { id: existingPdf.id } : {}),
            }),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            toast.error(errorData.error || "Failed to save PDF reference");
            return;
          }

          toast.success("PDF updated successfully");
        } else {
          // No chatId yet, store in localStorage temporarily
          if (typeof window !== "undefined") {
            localStorage.setItem(TEMP_PDF_KEY, url);
          }
          toast.success(
            "PDF uploaded temporarily. It will be saved when you send your first message."
          );
        }

        // Update the viewer state with the new URL
        setViewerState({
          pdfFile: file,
          pdfUrl: url,
        });
      } catch (error) {
        console.error("Error uploading PDF:", error);
        toast.error("Failed to upload PDF");
      }
    } else if (file) {
      toast.error("Please upload a valid PDF file.");
    }
  };

  // The updated pdfBody now uses lector with local blob URL
  const pdfBody = (
    <>
      {localPdfUrl ? (
        <Root
          source={localPdfUrl}
          // h-[calc(100vh-80px)] is very important dont change
          className="flex bg-gray-50 h-[calc(100vh-80px)]"
          loader={<div className="p-4">Loading...</div>}
        >
          <div className="relative flex-1 overflow-auto">
            <div className="bg-gray-100 border-b p-1 flex items-center justify-center text-sm text-gray-600 gap-2">
              <ZoomOut className="px-3 py-1 -mr-2 text-gray-900">-</ZoomOut>
              <CurrentZoom className="bg-white rounded-full px-3 py-1 border text-center w-16" />
              <ZoomIn className="px-3 py-1 -ml-2 text-gray-900">+</ZoomIn>
            </div>

            <Pages className="p-4 h-full">
              <Page>
                <CanvasLayer />
                <TextLayer />
              </Page>
            </Pages>
            <PageNavigationButtons />
          </div>
        </Root>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <p>Loading PDF...</p>
            </div>
          ) : (
            <FileUpload onChange={handleFileUpload} />
          )}
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
                  className={cn(
                    "order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0 flex items-center text-gray-600 dark:text-gray-300 cursor-pointer"
                  )}
                  onClick={() => {
                    // Revoke URL when reuploading
                    if (localPdfUrl && localPdfUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(localPdfUrl);
                    }
                    // Also clear from localStorage if it exists there
                    if (typeof window !== "undefined") {
                      localStorage.removeItem(TEMP_PDF_KEY);
                    }
                    setViewerState({ pdfFile: null, pdfUrl: null });
                    setLocalPdfUrl(null);
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
