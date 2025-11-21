// src/app/dashboard/equipos/page.tsx
import { Laptop, Plus, Search } from "lucide-react";

export default function EquiposPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-blue-600 to-blue-700">
              <Laptop className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Gestión de Equipos
              </h2>
              <p className="text-slate-400">
                Administra el inventario de equipos
              </p>
            </div>
          </div>
          <button className="btn-primary-dark flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-dark p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar equipos..."
              className="input-dark w-full pl-10"
            />
          </div>
          <select className="input-dark">
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>En reparación</option>
            <option>Inactivo</option>
          </select>
        </div>
      </div>

      {/* Equipment List (Mock Data) */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">
          Lista de Equipos
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="glass-dark p-4 rounded-lg border border-slate-700 hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <Laptop className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100">
                      Equipo #{item}
                    </h4>
                    <p className="text-sm text-slate-400">
                      Última actualización: 2024-11-20
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-600/20 text-green-400 text-sm font-medium">
                  Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
