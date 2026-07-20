// src/components/licenses/ClientSearchSelect.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ClientOption {
  id: string;
  name: string;
}

interface ClientSearchSelectProps {
  value: string; // id del cliente seleccionado ("" = ninguno)
  onChange: (id: string) => void;
  initialLabel?: string; // nombre del cliente seleccionado (modo edición / display)
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  allowClear?: boolean; // muestra la opción "Todos" (para filtros)
}

async function fetchClients(search: string): Promise<ClientOption[]> {
  const params = new URLSearchParams({
    search,
    limit: "50",
    sortBy: "name",
    sortOrder: "asc",
  });
  const res = await apiFetch(`/api/clients?${params.toString()}`);
  if (!res.ok) throw new Error("Error buscando clientes");
  const data = await res.json();
  return (data.clients ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));
}

export default function ClientSearchSelect({
  value,
  onChange,
  initialLabel = "",
  placeholder = "Buscar cliente...",
  disabled = false,
  error = false,
  allowClear = false,
}: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar el label mostrado con la selección externa
  useEffect(() => {
    setSelectedLabel(initialLabel);
  }, [initialLabel]);
  useEffect(() => {
    if (!value) setSelectedLabel("");
  }, [value]);

  // Debounce del texto de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: clients = [], isFetching } = useQuery({
    queryKey: ["client-search", debounced],
    queryFn: () => fetchClients(debounced),
    enabled: open,
    staleTime: 30000,
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectClient = (c: ClientOption) => {
    onChange(c.id);
    setSelectedLabel(c.name);
    setOpen(false);
    setQuery("");
  };

  const clearSelection = () => {
    onChange("");
    setSelectedLabel("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <div
          onClick={() => !disabled && setOpen(true)}
          className={`input-dark w-full flex justify-between items-center gap-2 ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${error ? "border-red-500" : ""}`}
        >
          <span
            className={
              selectedLabel ? "text-slate-100 truncate" : "text-slate-400 truncate"
            }
          >
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {allowClear && value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="p-0.5 text-slate-400 hover:text-slate-200"
                aria-label="Limpiar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe el nombre..."
            className={`input-dark-with-icon w-full ${error ? "border-red-500" : ""}`}
          />
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl">
          {allowClear && (
            <button
              type="button"
              onClick={clearSelection}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-700"
            >
              Todos
            </button>
          )}
          {isFetching && (
            <div className="px-3 py-2 text-sm text-slate-400">Buscando...</div>
          )}
          {!isFetching && clients.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">Sin resultados</div>
          )}
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectClient(c)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${
                c.id === value ? "bg-slate-700 text-white" : "text-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
