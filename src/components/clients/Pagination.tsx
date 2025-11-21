// src/components/clients/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (isMobile: boolean) => {
    const pages: (number | string)[] = [];
    const maxVisible = isMobile ? 3 : 7;
    const showEllipsis = totalPages > maxVisible;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (isMobile) {
        // Mobile: mostrar solo página actual con anterior/siguiente
        if (currentPage === 1) {
          pages.push(1, 2, "...");
        } else if (currentPage === totalPages) {
          pages.push("...", totalPages - 1, totalPages);
        } else {
          pages.push("...", currentPage, "...");
        }
      } else {
        // Desktop: mostrar más páginas
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, "...", totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(
            1,
            "...",
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
          );
        } else {
          pages.push(
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            totalPages
          );
        }
      }
    }

    return pages;
  };

  const desktopPages = getPageNumbers(false);
  const mobilePages = getPageNumbers(true);

  return (
    <div className="card-dark p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs md:text-sm text-slate-400 order-2 sm:order-1">
          Página {currentPage} de {totalPages}
        </div>

        <div className="flex items-center space-x-1 order-1 sm:order-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage || isLoading}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Mobile Page Numbers */}
          <div className="flex space-x-1 sm:hidden">
            {mobilePages.map((page, index) => (
              <div key={`mobile-${index}`}>
                {page === "..." ? (
                  <span className="px-2 py-2 text-slate-400 text-sm">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Page Numbers */}
          <div className="hidden sm:flex space-x-1">
            {desktopPages.map((page, index) => (
              <div key={`desktop-${index}`}>
                {page === "..." ? (
                  <span className="px-3 py-2 text-slate-400">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || isLoading}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
