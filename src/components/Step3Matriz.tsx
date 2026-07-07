"use client";

import { RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const resultadosEstandarizados = [
  { nombre: "Elaboración de Documentos y Reportes", tipo: "Absoluto", indicador: "Documentos aprobados" },
  { nombre: "Contratación de Bienes y Servicios", tipo: "Absoluto", indicador: "Bienes y servicios contratados" },
  { nombre: "Desarrollo de Capacitaciones", tipo: "Absoluto", indicador: "Certificados emitidos" },
  { nombre: "Mantenimiento de Infraestructura", tipo: "Absoluto", indicador: "Actas de conformidad" },
  { nombre: "Atención de Trámites", tipo: "Porcentual", indicador: "Porcentaje de trámites atendidos" },
  { nombre: "Otro (Personalizado)", tipo: "Absoluto", indicador: "" }
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
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-bold uppercase">Techo Presupuestario General</p>
            <p className="text-lg font-bold text-emerald-700">Bs. 5,000,000.00</p>
          </div>
          <div className="text-right border-l pl-4 border-slate-300">
            <p className="text-sm text-slate-500 font-bold uppercase">Techo Presupuestario Carrera</p>
            <p className="text-lg font-bold text-blue-700">Bs. 1,200,000.00</p>
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
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">{rpIndex + 1}</span>
                  {rpName}
                </h3>
              </div>

              {rpRows.length === 0 ? (
                <div className="flex flex-col">
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    No hay resultados intermedios para este resultado principal.
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-300">
                    <button 
                      onClick={() => addRowGroup(rp.id)}
                      className="flex items-center gap-2 bg-white text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-bold shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Agregar Resultado Intermedio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <th className="p-2 border-r border-slate-200 font-semibold w-12 text-center">N°</th>
                          <th className="p-2 border-r border-slate-200 font-semibold w-64 text-left">Resultado Intermedio</th>
                          <th className="p-2 border-r border-slate-200 font-semibold w-48 text-left">Indicador</th>
                          <th className="p-2 border-r border-slate-200 font-semibold w-32 text-center">Tipo de Meta</th>
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
                          const isEvenGroup = relativeIndex % 2 === 0;
                          const groupBg = isEvenGroup ? "bg-white" : "bg-slate-50";

                          return (
                            <tr key={row.id} className={cn("border-b border-slate-200 hover:bg-slate-100 transition-colors", groupBg)}>
                              <td className="p-2 border-r border-slate-200 text-center font-bold text-primary align-middle">
                                {rpIndex + 1}.{relativeIndex + 1}
                              </td>
                              <td className="p-2 border-r border-slate-200 align-top space-y-2">
                                {row.isMandatory ? (
                                  <div className="w-full min-h-[50px] p-2 border border-slate-200 rounded text-sm bg-slate-100 text-slate-600">
                                    {row.producto}
                                  </div>
                                ) : (
                                  <>
                                    <select 
                                      className="w-full p-1.5 border border-slate-300 rounded text-sm bg-slate-50 focus:ring-1 focus:ring-primary outline-none"
                                      value={row.productoSelect}
                                      onChange={(e) => updateRow(absoluteIndex, "productoSelect", e.target.value)}
                                    >
                                      <option value="">Seleccione o cree...</option>
                                      {resultadosEstandarizados.map(res => (
                                        <option key={res.nombre} value={res.nombre}>{res.nombre}</option>
                                      ))}
                                    </select>
                                    {row.productoSelect === "Otro (Personalizado)" && (
                                      <textarea
                                        className="w-full min-h-[50px] p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-primary outline-none resize-none mt-2"
                                        placeholder="Describa el resultado..."
                                        value={row.producto}
                                        onChange={(e) => updateRow(absoluteIndex, "producto", e.target.value)}
                                      />
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="p-1 border-r border-slate-200 align-top">
                                {row.isMandatory ? (
                                  <div className="w-full h-full min-h-[80px] p-2 rounded bg-slate-100 text-slate-600 text-sm">
                                    {row.indicador}
                                  </div>
                                ) : (
                                  <textarea
                                    className="w-full h-full min-h-[80px] p-2 bg-transparent resize-none outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-sm disabled:text-slate-500"
                                    placeholder="Ingrese el indicador..."
                                    value={row.indicador}
                                    onChange={(e) => updateRow(absoluteIndex, "indicador", e.target.value)}
                                    disabled={row.productoSelect !== "Otro (Personalizado)" && row.productoSelect !== ""}
                                  />
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center align-top">
                                {row.isMandatory ? (
                                  <div className="w-full p-1.5 rounded text-sm bg-slate-100 text-slate-600 font-medium border border-transparent">
                                    {row.tipo}
                                  </div>
                                ) : (
                                  <select 
                                    className="w-full p-1.5 border border-slate-300 rounded text-sm bg-white focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                    value={row.tipo}
                                    onChange={(e) => updateRow(absoluteIndex, "tipo", e.target.value)}
                                    disabled={row.productoSelect !== "Otro (Personalizado)" && row.productoSelect !== ""}
                                  >
                                    <option value="Absoluto">Absoluto</option>
                                    <option value="Porcentual">Porcentual (%)</option>
                                  </select>
                                )}
                              </td>

                              {row.meses.map((val, mIndex) => (
                                <td key={mIndex} className="p-0 border-r border-slate-200">
                                  <input
                                    type="number"
                                    className="w-full h-full min-h-[40px] p-1 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-primary text-sm"
                                    value={val}
                                    placeholder="0"
                                    onChange={(e) => updateMonth(absoluteIndex, mIndex, e.target.value)}
                                  />
                                </td>
                              ))}

                              <td className={cn(
                                "p-2 border-r border-slate-200 text-center font-bold text-sm",
                                row.tipo === "Porcentual" && calculateTotal(row.meses) === 100 ? "bg-emerald-100 text-emerald-800" :
                                row.tipo === "Porcentual" && calculateTotal(row.meses) > 100 ? "bg-red-100 text-red-800" :
                                "bg-slate-100/50 text-slate-800"
                              )}>
                                {calculateTotal(row.meses).toLocaleString()}{row.tipo === "Porcentual" ? "%" : ""}
                              </td>

                              <td className="p-2 text-center align-middle">
                                {!row.isMandatory && (
                                  <button 
                                    onClick={() => removeRowGroup(absoluteIndex)}
                                    className="text-secondary hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                                    title="Eliminar fila"
                                  >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-300">
                    <button 
                      onClick={() => addRowGroup(rp.id)}
                      className="flex items-center gap-2 bg-white text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-bold shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Agregar Resultado Intermedio
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 border border-emerald-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="bg-emerald-50/80 border-b border-emerald-200 px-4 py-3">
          <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-lg">
            Asignación Presupuestaria Global
          </h3>
          <p className="text-emerald-600 text-sm">Distribuya el Techo Presupuestario de Carrera (Bs. 1,200,000.00) entre todos los resultados intermedios.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-50 text-emerald-800 border-b border-emerald-200">
                <th className="p-2 border-r border-emerald-200 font-semibold w-16 text-center">N°</th>
                <th className="p-2 border-r border-emerald-200 font-semibold text-left">Resultado Principal</th>
                <th className="p-2 border-r border-emerald-200 font-semibold text-left">Resultado Intermedio</th>
                <th className="p-2 font-semibold w-48 text-right">Presupuesto (Bs)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const rpIndex = resultadosPrincipales.findIndex(rp => rp.id === row.resultadoPrincipalId);
                const rpRows = rows.filter(r => r.resultadoPrincipalId === row.resultadoPrincipalId);
                const relativeIndex = rpRows.findIndex(r => r.id === row.id);
                const rpName = resultadosPrincipales[rpIndex]?.resultado || `Resultado Principal ${rpIndex + 1}`;

                return (
                  <tr key={row.id} className="border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                    <td className="p-2 border-r border-emerald-100 text-center font-bold text-emerald-700">{rpIndex + 1}.{relativeIndex + 1}</td>
                    <td className="p-2 border-r border-emerald-100 text-slate-600 text-xs">{rpName}</td>
                    <td className="p-2 border-r border-emerald-100 text-slate-700">{row.producto || `Resultado Intermedio (Sin definir)`}</td>
                    <td className="p-0">
                      <input
                        type="number"
                        className="w-full h-full min-h-[40px] p-2 text-right bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-emerald-500 text-sm font-bold text-emerald-700"
                        value={row.presupuesto || ""}
                        placeholder="0.00"
                        onChange={(e) => updateRow(index, "presupuesto", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {(() => {
                const totalPresupuesto = rows.reduce((acc, r) => acc + (Number(r.presupuesto) || 0), 0);
                const techoCarrera = 1200000;
                const restante = techoCarrera - totalPresupuesto;
                const isExceeded = restante < 0;

                return (
                  <>
                    <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                      <td colSpan={3} className="p-3 text-right text-emerald-800">TOTAL ASIGNADO:</td>
                      <td className="p-3 text-right text-emerald-700 text-base">{totalPresupuesto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className={cn("font-bold border-t border-emerald-200", isExceeded ? "bg-red-50 text-secondary" : "bg-emerald-100 text-emerald-800")}>
                      <td colSpan={3} className="p-3 text-right">PRESUPUESTO RESTANTE:</td>
                      <td className="p-3 text-right text-base">{restante.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    {isExceeded && (
                      <tr className="bg-red-100 text-secondary text-xs text-right">
                        <td colSpan={4} className="p-2 font-bold">
                          ⚠️ Se ha excedido el Techo Presupuestario de Carrera. Por favor ajuste los montos.
                        </td>
                      </tr>
                    )}
                  </>
                );
              })()}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
