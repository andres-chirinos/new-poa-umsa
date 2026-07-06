"use client";

import { RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const resultadosEstandarizados = [
  "Elaboración de Documentos y Reportes",
  "Contratación de Bienes y Servicios",
  "Desarrollo de Capacitaciones",
  "Mantenimiento de Infraestructura",
  "Atención de Trámites",
  "Otro (Personalizado)"
];

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  resultadosPrincipales: ResultadoPrincipal[];
  rows: RowData[];
  addRowGroup: (resultadoPrincipalId: string) => void;
  removeRowGroup: (index: number) => void;
  updateRow: (index: number, field: keyof RowData, value: string) => void;
  updateMonth: (rowIndex: number, monthIndex: number, value: string) => void;
  handleExportPdf: () => void;
}

export function Step3Matriz({ resultadosPrincipales, rows, addRowGroup, removeRowGroup, updateRow, updateMonth, handleExportPdf }: Props) {
  const calculateTotal = (meses: string[]) => {
    return meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">3. Matriz de Ejecución e Ingresos/Egresos</h2>
          <p className="text-slate-500 text-sm -mt-4">
            Defina los resultados intermedios asociados a cada Resultado Principal.
          </p>
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

      <div className="space-y-8">
        {resultadosPrincipales.map((rp, rpIndex) => {
          const rpName = rp.resultado || `Resultado Principal ${rpIndex + 1} (Sin definir)`;
          
          // Find rows that belong to this ResultadoPrincipal
          const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
          
          // For rendering, we need to find the absolute index of these rows in the main 'rows' array
          // so that updateRow/removeRowGroup works correctly since they rely on absolute indices.
          // Wait, actually passing absolute index is easier if we map over the main array or find the index dynamically.
          
          return (
            <div key={rp.id} className="border border-slate-300 rounded-lg shadow-sm bg-white overflow-hidden">
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{rpIndex + 1}</span>
                  {rpName}
                </h3>
              </div>

              {rpRows.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  No hay resultados intermedios para este resultado principal.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm min-w-max">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200 font-semibold w-12 text-center">N°</th>
                        <th className="p-2 border-r border-slate-200 font-semibold w-64 text-left">Resultado Intermedio</th>
                        <th className="p-2 border-r border-slate-200 font-semibold w-48 text-left">Indicador</th>
                        <th className="p-2 border-r border-slate-200 font-semibold w-32 text-center">Tipo</th>
                        {months.map(m => (
                          <th key={m} className="p-2 border-r border-slate-200 font-semibold w-20 text-center">{m}</th>
                        ))}
                        <th className="p-2 border-r border-slate-200 font-semibold w-28 text-center">Total</th>
                        <th className="p-2 font-semibold w-12 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rpRows.map((row, relativeIndex) => {
                        const absoluteIndex = rows.findIndex(r => r.id === row.id);
                        const groupIndex = Math.floor(relativeIndex / 3);
                        const isEvenGroup = groupIndex % 2 === 0;
                        const groupBg = isEvenGroup ? "bg-white" : "bg-slate-50";
                        const isFirstInGroup = relativeIndex % 3 === 0;

                        return (
                          <tr key={row.id} className={cn("border-b border-slate-200 hover:bg-slate-100 transition-colors", groupBg)}>
                            {isFirstInGroup ? (
                              <>
                                <td rowSpan={3} className="p-2 border-r border-slate-200 text-center font-bold text-primary align-middle">
                                  {rpIndex + 1}.{groupIndex + 1}
                                </td>
                                <td rowSpan={3} className="p-2 border-r border-slate-200 align-top space-y-2">
                                  <select 
                                    className="w-full p-1.5 border border-slate-300 rounded text-xs bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                                    value={row.productoSelect}
                                    onChange={(e) => updateRow(absoluteIndex, "productoSelect", e.target.value)}
                                  >
                                    <option value="">Seleccione o cree...</option>
                                    {resultadosEstandarizados.map(res => (
                                      <option key={res} value={res}>{res}</option>
                                    ))}
                                  </select>
                                  {row.productoSelect === "Otro (Personalizado)" && (
                                    <textarea
                                      className="w-full min-h-[50px] p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                                      placeholder="Describa el resultado..."
                                      value={row.producto}
                                      onChange={(e) => updateRow(absoluteIndex, "producto", e.target.value)}
                                    />
                                  )}
                                </td>
                                <td rowSpan={3} className="p-1 border-r border-slate-200 align-top">
                                  <textarea
                                    className="w-full h-full min-h-[80px] p-2 bg-transparent resize-none outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs"
                                    placeholder="Ingrese el indicador..."
                                    value={row.indicador}
                                    onChange={(e) => updateRow(absoluteIndex, "indicador", e.target.value)}
                                  />
                                </td>
                              </>
                            ) : null}

                            <td className="p-2 border-r border-slate-200 text-center font-medium">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                row.tipo === "Meta" ? "bg-blue-100 text-primary" : 
                                row.tipo === "Ingresos" ? "bg-emerald-100 text-emerald-700" :
                                "bg-red-100 text-secondary"
                              )}>
                                {row.tipo}
                              </span>
                            </td>

                            {row.meses.map((val, mIndex) => (
                              <td key={mIndex} className="p-0 border-r border-slate-200">
                                <input
                                  type="number"
                                  className="w-full h-full min-h-[40px] p-1 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-xs"
                                  value={val}
                                  placeholder="0"
                                  onChange={(e) => updateMonth(absoluteIndex, mIndex, e.target.value)}
                                />
                              </td>
                            ))}

                            <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 bg-slate-100/50 text-xs">
                              {row.tipo !== "Meta" ? "Bs. " : ""}
                              {calculateTotal(row.meses).toLocaleString()}
                            </td>

                            {isFirstInGroup ? (
                              <td rowSpan={3} className="p-2 text-center align-middle">
                                <button 
                                  onClick={() => removeRowGroup(absoluteIndex)}
                                  className="text-secondary hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="p-3 bg-slate-50 border-t border-slate-300">
                <button 
                  onClick={() => addRowGroup(rp.id)}
                  className="flex items-center gap-2 bg-white text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar Resultado Intermedio
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
