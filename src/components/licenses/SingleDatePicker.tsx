// src/components/licenses/SingleDatePicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ReactDOM from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface SingleDatePickerProps {
  value: string; // YYYY-MM-DD ("" = sin selección)
  onChange: (value: string) => void; // YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

// Parsea "YYYY-MM-DD" como fecha local (evita el corrimiento de zona de new Date("YYYY-MM-DD"))
function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export default function SingleDatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  error = false,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = parseLocalDate(value);

  const toggleCalendar = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(true);
  };

  // Cerrar al hacer click fuera del trigger y del calendario
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleCalendar}
        className={`input-dark w-full flex justify-between items-center ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${error ? "border-red-500" : ""}`}
      >
        <span className={selected ? "text-slate-100" : "text-slate-400"}>
          {selected ? format(selected, "dd/MM/yyyy") : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-300 shrink-0" />
      </div>

      {open &&
        coords &&
        ReactDOM.createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 10000,
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
              locale={es}
              classNames={{
                today: "ring-2 ring-blue-400 rounded-full",
                selected: "!bg-blue-600 !text-white rounded-full",
              }}
              className="bg-slate-800 p-2 rounded-lg border border-slate-600 shadow-xl"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
