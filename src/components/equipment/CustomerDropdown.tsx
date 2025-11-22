// src/components/equipment/CustomerDropdown.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, User, Phone, X, ChevronDown, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatPhone } from "@/lib/validations/client";

interface Customer {
  id: string;
  name: string;
  phone: string;
  ruc: string | null;
}

interface CustomerDropdownProps {
  value: string;
  onChange: (customerId: string, customer: Customer | null) => void;
  error?: string;
  disabled?: boolean;
}

export default function CustomerDropdown({
  value,
  onChange,
  error,
  disabled = false,
}: CustomerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar cliente seleccionado inicialmente
  useEffect(() => {
    if (value && !selectedCustomer) {
      const loadCustomer = async () => {
        try {
          const response = await apiFetch(`/api/clients/${value}`);
          if (response.ok) {
            const data = await response.json();
            setSelectedCustomer(data.client);
          }
        } catch (error) {
          console.error("Error cargando cliente:", error);
        }
      };
      loadCustomer();
    }
  }, [value, selectedCustomer]);

  // Buscar clientes
  const searchCustomers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: "10",
      });
      const response = await apiFetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.clients);
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      searchCustomers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isOpen, searchCustomers]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus en input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id, customer);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    onChange("", null);
    setSearch("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      searchCustomers("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Customer Display */}
      {selectedCustomer ? (
        <div
          className={`flex items-center justify-between gap-2 p-3 rounded-xl border bg-slate-800/50 ${
            error ? "border-red-500" : "border-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-500"}`}
          onClick={handleOpen}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30 shrink-0">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-100 truncate">
                {selectedCustomer.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                +51 {formatPhone(selectedCustomer.phone)}
              </div>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border bg-slate-800/50 text-left ${
            error ? "border-red-500" : "border-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-500"}`}
        >
          <span className="text-slate-400">Seleccionar cliente...</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Buscar por nombre o teléfono..."
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Buscando...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-4 text-center">
                <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {search ? "No se encontraron clientes" : "Escribe para buscar"}
                </p>
              </div>
            ) : (
              <ul>
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(customer)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30 shrink-0">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-100 truncate">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          +51 {formatPhone(customer.phone)}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
