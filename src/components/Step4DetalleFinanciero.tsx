"use client";

import { DetalleFinanciero, RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText } from "lucide-react";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  resultadosPrincipales: ResultadoPrincipal[];
  rows: RowData[];
  detalles: DetalleFinanciero[];
  addDetalle: (resultadoId: string) => void;
  removeDetalle: (id: string) => void;
  updateDetalle: (id: string, field: keyof DetalleFinanciero, value: string) => void;
  handleExportPdf: () => void;
}

export function Step4DetalleFinanciero({ resultadosPrincipales, rows, detalles, addDetalle, removeDetalle, updateDetalle, handleExportPdf }: Props) {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">4. Detalle de Gastos e Ingresos por Resultado</h2>
          <p className="text-slate-500 text-sm">Defina las partidas (egresos) y rubros (ingresos) asociados a cada resultado intermedio.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors text-sm font-bold shadow-sm"
          >
            <FileText className="w-4 h-4 text-secondary" /> Generar PDF
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {resultadosPrincipales.map((rp, rpIndex) => {
          const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id && r.tipo === "Meta"); // Unique intermediate results

          if (rpRows.length === 0) return null;

          return (
            <div key={rp.id} className="space-y-4">
              <h3 className="font-bold text-lg text-primary border-b-2 border-primary/20 pb-2">
                {rpIndex + 1}. {rp.resultado || "Resultado Principal Sin Definir"}
              </h3>
              
              <div className="space-y-6 pl-4">
                {rpRows.map((result, riIndex) => {
                  const resName = result.producto || `Resultado Intermedio ${riIndex + 1} (Sin definir)`;
                  const resDetalles = detalles.filter(g => g.resultadoId === result.id);
                  
                  const totalIngresos = resDetalles.filter(d => d.tipo === "Ingreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
                  const totalEgresos = resDetalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);

                  return (
                    <div key={result.id} className="border border-slate-300 rounded-lg shadow-sm bg-white overflow-hidden">
                      <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                          <span className="bg-slate-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                            {rpIndex + 1}.{riIndex + 1}
                          </span>
                          {resName}
                        </h4>
                        <button 
                          onClick={() => addDetalle(result.id)}
                          className="flex items-center gap-1 text-xs bg-white text-secondary border border-secondary px-3 py-1.5 rounded hover:bg-secondary hover:text-white transition-colors font-bold shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> Añadir Detalle Financiero
                        </button>
                      </div>

                      {resDetalles.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm italic">
                          No hay detalles financieros programados para este resultado. Haga clic en "Añadir Detalle Financiero".
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="p-2 border-r border-slate-200 font-semibold w-10 text-center">N°</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-24 text-center">Tipo</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-32 text-left">Rubro/Partida</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-64 text-left">Detalle</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-28 text-center">Mes</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-28 text-right">Unitario (Bs)</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-20 text-right">Cant.</th>
                                <th className="p-2 border-r border-slate-200 font-semibold w-32 text-right">Monto (Bs)</th>
                                <th className="p-2 font-semibold w-10 text-center">Acc.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resDetalles.map((detalle, dIndex) => {
                                const montoTotal = (Number(detalle.precioUnitario) || 0) * (Number(detalle.cantidad) || 0);
                                const isIngreso = detalle.tipo === "Ingreso";

                                return (
                                  <tr key={detalle.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="p-1 border-r border-slate-200 text-center text-xs text-slate-500">
                                      {dIndex + 1}
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <select 
                                        className="w-full h-full p-2 border-none bg-transparent focus:ring-1 focus:ring-inset focus:ring-primary outline-none text-xs font-bold"
                                        value={detalle.tipo}
                                        onChange={(e) => updateDetalle(detalle.id, "tipo", e.target.value)}
                                        style={{ color: isIngreso ? '#047857' : '#b91c1c' }}
                                      >
                                        <option value="Egreso">Egreso</option>
                                        <option value="Ingreso">Ingreso</option>
                                      </select>
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <input
                                        type="text"
                                        className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs uppercase"
                                        value={detalle.partida}
                                        placeholder="Ej: 21100"
                                        onChange={(e) => updateDetalle(detalle.id, "partida", e.target.value)}
                                      />
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <textarea
                                        className="w-full h-full min-h-[40px] p-2 bg-transparent resize-none outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs"
                                        value={detalle.detalle}
                                        placeholder="Describa el ingreso/gasto..."
                                        onChange={(e) => updateDetalle(detalle.id, "detalle", e.target.value)}
                                      />
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <select 
                                        className="w-full h-full p-2 border-none bg-transparent focus:ring-1 focus:ring-inset focus:ring-primary outline-none text-xs text-center"
                                        value={detalle.mes}
                                        onChange={(e) => updateDetalle(detalle.id, "mes", e.target.value)}
                                      >
                                        {months.map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <input
                                        type="number"
                                        className="w-full h-full p-2 text-right bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs font-medium"
                                        value={detalle.precioUnitario}
                                        placeholder="0.00"
                                        onChange={(e) => updateDetalle(detalle.id, "precioUnitario", e.target.value)}
                                      />
                                    </td>
                                    <td className="p-0 border-r border-slate-200">
                                      <input
                                        type="number"
                                        className="w-full h-full p-2 text-right bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs"
                                        value={detalle.cantidad}
                                        placeholder="0"
                                        onChange={(e) => updateDetalle(detalle.id, "cantidad", e.target.value)}
                                      />
                                    </td>
                                    <td className={`p-2 border-r border-slate-200 text-right font-bold text-xs ${isIngreso ? 'text-emerald-700 bg-emerald-50/30' : 'text-secondary bg-red-50/20'}`}>
                                      {montoTotal.toFixed(2)}
                                    </td>
                                    <td className="p-1 text-center align-middle">
                                      <button 
                                        onClick={() => removeDetalle(detalle.id)}
                                        className="text-secondary hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition-colors"
                                        title="Eliminar fila"
                                      >
                                        <Trash2 className="w-4 h-4 mx-auto" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              {totalIngresos > 0 && (
                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                  <td colSpan={7} className="p-2 text-right text-slate-700 text-xs">
                                    TOTAL INGRESOS (Bs):
                                  </td>
                                  <td className="p-2 text-right text-emerald-700 text-sm">
                                    {totalIngresos.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              )}
                              {totalEgresos > 0 && (
                                <tr className="bg-slate-100 font-bold border-t border-slate-200">
                                  <td colSpan={7} className="p-2 text-right text-slate-700 text-xs">
                                    TOTAL EGRESOS (Bs):
                                  </td>
                                  <td className="p-2 text-right text-secondary text-sm">
                                    {totalEgresos.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              )}
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
