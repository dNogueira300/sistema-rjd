// src/app/dashboard/clientes/page.tsx
import { Users, Plus, Search, Phone, Mail } from "lucide-react";

const mockClientes = [
  {
    id: 1,
    name: "Juan Pérez Sistemas",
    phone: "+51 987 654 321",
    email: "juan@sistemas.com",
    ruc: "20123456789",
    equipos: 5,
    ultimaVisita: "2024-11-20",
    estado: "activo",
  },
  {
    id: 2,
    name: "María García Contadores",
    phone: "+51 999 888 777",
    email: "maria@contadores.com",
    ruc: "20987654321",
    equipos: 3,
    ultimaVisita: "2024-11-18",
    estado: "activo",
  },
  {
    id: 3,
    name: "Carlos López Consultores",
    phone: "+51 911 222 333",
    email: "carlos@consultores.com",
    ruc: "20555666777",
    equipos: 8,
    ultimaVisita: "2024-11-15",
    estado: "inactivo",
  },
  {
    id: 4,
    name: "Ana Rodríguez Servicios",
    phone: "+51 944 555 666",
    email: "ana@servicios.com",
    ruc: "20888999111",
    equipos: 2,
    ultimaVisita: "2024-11-19",
    estado: "activo",
  },
  {
    id: 5,
    name: "Luis Morales Tech",
    phone: "+51 977 111 222",
    email: "luis@tech.com",
    ruc: "20333444555",
    equipos: 12,
    ultimaVisita: "2024-11-17",
    estado: "activo",
  },
];

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-purple-600 to-purple-700">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Gestión de Clientes
              </h2>
              <p className="text-slate-400">
                Administra tu cartera de clientes
              </p>
            </div>
          </div>
          <button className="btn-primary-dark flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="lg:col-span-3 card-dark p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="input-dark w-full pl-10"
              />
            </div>
            <select className="input-dark">
              <option>Todos los estados</option>
              <option>Activos</option>
              <option>Inactivos</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-dark p-6 bg-purple-600/10 border border-purple-600/30">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-slate-100 mb-1">
              {mockClientes.length}
            </h3>
            <p className="text-sm font-medium text-slate-300 mb-1">
              Total Clientes
            </p>
            <p className="text-xs text-slate-400">
              {mockClientes.filter((c) => c.estado === "activo").length} activos
            </p>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockClientes.map((cliente) => (
          <div
            key={cliente.id}
            className="card-dark p-6 hover-lift border-l-4 border-purple-600"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600/20">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {cliente.name}
                  </h3>
                  <p className="text-sm text-slate-400">RUC: {cliente.ruc}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  cliente.estado === "activo"
                    ? "bg-green-600/20 text-green-400"
                    : "bg-gray-600/20 text-gray-400"
                }`}
              >
                {cliente.estado === "activo" ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="space-y-3">
              {/* Contact Info */}
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{cliente.phone}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{cliente.email}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-100">
                    {cliente.equipos}
                  </p>
                  <p className="text-xs text-slate-400">Equipos</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    {cliente.ultimaVisita}
                  </p>
                  <p className="text-xs text-slate-400">Última visita</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm py-2 px-3 rounded-lg transition-colors">
                  Ver Detalles
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">
          Actividad Reciente de Clientes
        </h3>
        <div className="space-y-3">
          {mockClientes.slice(0, 3).map((cliente, index) => (
            <div
              key={index}
              className="glass-dark p-4 rounded-lg border border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-600/20">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {cliente.name}
                  </h4>
                  <p className="text-sm text-slate-400">
                    Última interacción: {cliente.ultimaVisita}
                  </p>
                </div>
              </div>
              <span className="text-sm text-slate-300">
                {cliente.equipos} equipos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
