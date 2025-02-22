import React from "react";
import { SearchResult } from "@unriddle-ai/lector";

interface SearchResultsProps {
  searchText: string;
  results: SearchResult[];
  onLoadMore: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchText,
  results,
  onLoadMore,
}) => {
  if (!searchText) {
    return (
      <div className="p-4 text-gray-500">
        Enter a search term to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.length > 0 ? (
        <>
          {results.map((result) => (
            <div
              key={`${result.pageNumber}-${result.matchIndex}`}
              className="py-2 border-b border-gray-100"
            >
              <p className="text-sm text-gray-900">{result.text}</p>
              <span className="text-xs text-gray-500">
                Page {result.pageNumber}
              </span>
            </div>
          ))}
          <button
            onClick={onLoadMore}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Load More
          </button>
        </>
      ) : (
        <div className="p-4 text-gray-500">No results found.</div>
      )}
    </div>
  );
};

export default SearchResults;
