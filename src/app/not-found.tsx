import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-pattern flex items-center justify-center px-4">
      <div className="card-dark p-8 md:p-10 max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-blue-400 mb-1">Error 404</p>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Página no encontrada
        </h1>
        <p className="text-slate-400 mb-6">
          La dirección que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary-dark inline-flex items-center justify-center px-5 py-2.5 rounded-xl"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  );
}
