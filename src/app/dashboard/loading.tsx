// Se muestra al instante mientras carga el módulo al que se navega,
// para que el cambio entre módulos no se sienta "congelado".
export default function DashboardLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse" aria-busy="true">
      <div className="card-dark p-4 md:p-6 h-20 md:h-24" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-dark h-20 md:h-24" />
        ))}
      </div>
      <div className="card-dark h-80" />
    </div>
  );
}
