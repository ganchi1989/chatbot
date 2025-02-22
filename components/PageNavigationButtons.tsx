"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePdf, usePdfJump } from "@unriddle-ai/lector";

const PageNavigationButtons = () => {
  const pages = usePdf((state) => state.pdfDocumentProxy?.numPages);
  const currentPage = usePdf((state) => state.currentPage);
  const [pageNumber, setPageNumber] = useState<string | number>(currentPage);
  const { jumpToPage } = usePdfJump();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      jumpToPage(currentPage - 1, { behavior: "auto" });
    }
  };

  const handleNextPage = () => {
    if (pages && currentPage < pages) {
      jumpToPage(currentPage + 1, { behavior: "auto" });
    }
  };

  useEffect(() => {
    setPageNumber(currentPage);
  }, [currentPage]);

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2.5 border border-gray-200">
      <Button
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
        className="rounded-full bg-transparent hover:bg-gray-200 dark:bg-white disabled:opacity-40"
        aria-label="Previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Button>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          onBlur={(e) => {
            const value = Number(e.target.value);
            if (
              pages &&
              value >= 1 &&
              value <= pages &&
              currentPage !== value
            ) {
              jumpToPage(value, { behavior: "auto" });
            } else {
              setPageNumber(currentPage);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-12 h-7 text-center text-gray-500 dark:bg-white  border rounded-md text-sm focus:ring-2"
        />
        <span className="text-sm text-gray-500 font-medium">
          / {pages || 1}
        </span>
      </div>

      <Button
        onClick={handleNextPage}
        disabled={pages ? currentPage >= pages : true}
        className="rounded-full bg-transparent hover:bg-gray-200 dark:bg-white  disabled:opacity-40"
        aria-label="Next page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
    </div>
  );
};

export default PageNavigationButtons;
