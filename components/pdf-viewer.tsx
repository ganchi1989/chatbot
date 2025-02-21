"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { UploadIcon, ZoomInIcon, ZoomOutIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ onClose }: { onClose: () => void }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto adjust scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Assume base PDF page width of 800px. Adjust this value if needed.
        const newScale = containerWidth / 800;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) {
      e.target.value = "";
    }
    if (file && file.type === "application/pdf") {
      setFileKey((prev) => prev + 1);
      setPdfFile(file);
      setNumPages(0);
      setCurrentPage(1);
    } else if (file) {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setFileKey((prev) => prev + 1);
      setPdfFile(file);
      setNumPages(0);
      setCurrentPage(1);
    } else if (file) {
      alert("Please drop a valid PDF file.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1);
  };

  const zoomIn = () => {
    setScale((prevScale) => prevScale + 0.2);
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.2));
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="font-semibold">PDF Viewer</h3>
        <div className="flex items-center space-x-2">
          {pdfFile && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center text-muted-foreground cursor-pointer"
              )}
              onClick={() => {
                document.getElementById("reupload-input")?.click();
              }}
            >
              <UploadIcon size={16} className="mr-1" />
              Reupload
            </Button>
          )}
          <input
            id="reupload-input"
            type="file"
            onChange={handleFileChange}
            accept="application/pdf"
            hidden
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </div>
      {pdfFile && numPages > 0 && (
        <div className="flex items-center justify-center p-2 border-t space-x-4">
          <Button onClick={zoomOut} variant="ghost" size="sm">
            <ZoomOutIcon size={16} />
          </Button>
          <Button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
          >
            Prev
          </Button>
          <span className="mx-4">
            Page {currentPage} of {numPages}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={currentPage === numPages}
            variant="ghost"
            size="sm"
          >
            Next
          </Button>
          <Button onClick={zoomIn} variant="ghost" size="sm">
            <ZoomInIcon size={16} />
          </Button>
        </div>
      )}
      <div ref={containerRef} className="flex-1 p-4 overflow-auto">
        {pdfFile ? (
          <Document
            key={fileKey}
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false} // Disable text layer rendering to prevent AbortException warnings.
              className="mx-auto mb-4"
            />
          </Document>
        ) : (
          <div
            className="relative flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept="application/pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="hidden md:block">
              <p className="text-muted-foreground text-center">
                {isDragging
                  ? "Drop your PDF here"
                  : "Drop your PDF here or click to browse."}
              </p>
            </div>
            <div className="md:hidden">
              <Button asChild>
                <label
                  htmlFor="small-screen-upload"
                  className="w-full cursor-pointer"
                >
                  Upload PDF
                </label>
              </Button>
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                hidden
                id="small-screen-upload"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
