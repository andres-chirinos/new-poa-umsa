"use client";

import { RowData, ResultadoPrincipal } from "@/types/poa";
import { cn } from "@/lib/utils";

interface PresupuestoGlobalProps {
  resultadosPrincipales: ResultadoPrincipal[];
  rows: RowData[];
  updateRow: (index: number, field: keyof RowData, value: string) => void;
  activeCell: {
    tableType: "matriz" | "presupuesto";
    rpId?: string;
    rowIndex: number;
    colIndex: number;
    isEditing: boolean;
  } | null;
  handleCellFocus: (
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number,
    isEditingState?: boolean
  ) => void;
  handleCellKeyDown: (
    e: React.KeyboardEvent,
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number,
    isEditable: boolean,
    rowId: string,
    absoluteIndex: number
  ) => void;
  handleInputKeyDown: (
    e: React.KeyboardEvent,
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number
  ) => void;
  isCellActive: (type: "matriz" | "presupuesto", targetRpId: string | undefined, rIdx: number, cIdx: number) => boolean;
  isRowActive: (type: "matriz" | "presupuesto", targetRpId: string | undefined, rIdx: number) => boolean;
  isColActive: (type: "matriz" | "presupuesto", targetRpId: string | undefined, cIdx: number) => boolean;
  getCellClassName: (
    type: "matriz" | "presupuesto",
    targetRpId: string | undefined,
    rIdx: number,
    cIdx: number,
    isEditable: boolean,
    isModified: boolean,
    baseClass?: string
  ) => string;
  setActiveCell: React.Dispatch<React.SetStateAction<{
    tableType: "matriz" | "presupuesto";
    rpId?: string;
    rowIndex: number;
    colIndex: number;
    isEditing: boolean;
  } | null>>;
  zoomLevel: "normal" | "large" | "xlarge";
  modifiedCells: Set<string>;
  triggerWarning: () => void;
}

const zoomClass = {
  normal: "text-sm",
  large: "text-base [&_input]:text-base [&_select]:text-base [&_textarea]:text-base",
  xlarge: "text-lg [&_input]:text-lg [&_select]:text-lg [&_textarea]:text-lg [&_td]:p-3 [&_th]:p-3 [&_button]:scale-110"
};

export function Step3PresupuestoGlobal({
  resultadosPrincipales,
  rows,
  updateRow,
  activeCell,
  handleCellFocus,
  handleCellKeyDown,
  handleInputKeyDown,
  isCellActive,
  isRowActive,
  isColActive,
  getCellClassName,
  setActiveCell,
  zoomLevel,
  modifiedCells,
  triggerWarning
}: PresupuestoGlobalProps) {
  const isAnyBudgetModified = rows.some(r => modifiedCells.has(`budget-${r.id}`));

  return (
    <div className="mt-8 border border-emerald-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <div className="bg-emerald-50/80 border-b border-emerald-200 px-4 py-3">
        <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-lg">
          Asignación Presupuestaria Global
        </h3>
        <p className="text-emerald-600 text-sm">
          Distribuya el Techo Presupuestario de Carrera (Bs. 1,200,000.00) entre todos los resultados intermedios. Use las flechas para navegar.
        </p>
      </div>
      <div className={cn("overflow-x-auto transition-all duration-200", zoomClass[zoomLevel])}>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-emerald-50 text-emerald-800 border-b border-emerald-200">
              <th className={cn(
                "p-2 border-r border-emerald-200 font-semibold w-16 text-center transition-colors duration-150",
                isColActive("presupuesto", undefined, 0) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
              )}>
                N°
              </th>
              <th className={cn(
                "p-2 border-r border-emerald-200 font-semibold text-left transition-colors duration-150",
                isColActive("presupuesto", undefined, 1) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
              )}>
                Resultado Principal
              </th>
              <th className={cn(
                "p-2 border-r border-emerald-200 font-semibold text-left transition-colors duration-150",
                isColActive("presupuesto", undefined, 2) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
              )}>
                Resultado Intermedio
              </th>
              <th className={cn(
                "p-2 font-semibold w-48 text-right transition-colors duration-150",
                isColActive("presupuesto", undefined, 3) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
              )}>
                Presupuesto (Bs)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rpIndex = resultadosPrincipales.findIndex(rp => rp.id === row.resultadoPrincipalId);
              const rpRows = rows.filter(r => r.resultadoPrincipalId === row.resultadoPrincipalId);
              const relativeIndex = rpRows.findIndex(r => r.id === row.id);
              const rpName = resultadosPrincipales[rpIndex]?.resultado || `Resultado Principal ${rpIndex + 1}`;
              const rowActive = isRowActive("presupuesto", undefined, index);
              const isBudgetModified = modifiedCells.has(`budget-${row.id}`);

              return (
                <tr key={row.id} className="border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                  {/* Budget Col 0 */}
                  <td 
                    id={`cell-presupuesto-${index}-0`}
                    tabIndex={0}
                    onFocus={() => handleCellFocus("presupuesto", undefined, index, 0, false)}
                    onKeyDown={(e) => handleCellKeyDown(e, "presupuesto", undefined, index, 0, false, row.id, index)}
                    onDoubleClick={triggerWarning}
                    className={getCellClassName("presupuesto", undefined, index, 0, false, false, cn(
                      "p-2 border-r border-emerald-100 text-center font-bold transition-colors select-none",
                      rowActive ? "text-emerald-900 bg-emerald-100/50" : "text-emerald-700"
                    ))}
                  >
                    {rpIndex + 1}.{relativeIndex + 1}
                  </td>

                  {/* Budget Col 1 */}
                  <td 
                    id={`cell-presupuesto-${index}-1`}
                    tabIndex={0}
                    onFocus={() => handleCellFocus("presupuesto", undefined, index, 1, false)}
                    onKeyDown={(e) => handleCellKeyDown(e, "presupuesto", undefined, index, 1, false, row.id, index)}
                    onDoubleClick={triggerWarning}
                    className={getCellClassName("presupuesto", undefined, index, 1, false, false, "p-2 border-r border-emerald-100 text-slate-600 text-sm align-middle select-none")}
                  >
                    {rpName}
                  </td>

                  {/* Budget Col 2 */}
                  <td 
                    id={`cell-presupuesto-${index}-2`}
                    tabIndex={0}
                    onFocus={() => handleCellFocus("presupuesto", undefined, index, 2, false)}
                    onKeyDown={(e) => handleCellKeyDown(e, "presupuesto", undefined, index, 2, false, row.id, index)}
                    onDoubleClick={triggerWarning}
                    className={getCellClassName("presupuesto", undefined, index, 2, false, false, "p-2 border-r border-emerald-100 text-slate-700 align-middle select-none")}
                  >
                    {row.producto || `Resultado Intermedio (Sin definir)`}
                  </td>

                  {/* Budget Col 3 */}
                  {(() => {
                    const isEditingThis = isCellActive("presupuesto", undefined, index, 3) && activeCell?.isEditing;
                    return (
                      <td 
                        id={`cell-presupuesto-${index}-3`}
                        tabIndex={0}
                        onFocus={() => handleCellFocus("presupuesto", undefined, index, 3, false)}
                        onKeyDown={(e) => handleCellKeyDown(e, "presupuesto", undefined, index, 3, true, row.id, index)}
                        onDoubleClick={() => {
                          setActiveCell({ tableType: "presupuesto", rowIndex: index, colIndex: 3, isEditing: true });
                          setTimeout(() => {
                            const inputId = `input-presupuesto-${index}-3`;
                            const input = document.getElementById(inputId) as HTMLInputElement | null;
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }, 0);
                        }}
                        className={getCellClassName("presupuesto", undefined, index, 3, true, isBudgetModified, "p-0 align-middle")}
                      >
                        <input
                          id={`input-presupuesto-${index}-3`}
                          tabIndex={-1}
                          type="number"
                          className={cn(
                            "w-full h-full min-h-[40px] p-2 text-right bg-transparent outline-none focus:bg-white text-sm font-bold border-0 focus:ring-0 focus:border-0 rounded",
                            isBudgetModified && !isEditingThis ? "text-amber-900" : "text-emerald-700",
                            !isEditingThis && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          )}
                          value={row.presupuesto || ""}
                          placeholder="0.00"
                          onChange={(e) => updateRow(index, "presupuesto", e.target.value)}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setActiveCell({ tableType: "presupuesto", rowIndex: index, colIndex: 3, isEditing: true });
                          }}
                          onKeyDown={(e) => handleInputKeyDown(e, "presupuesto", undefined, index, 3)}
                        />
                      </td>
                    );
                  })()}
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
                  <tr className={cn(
                    "font-bold border-t-2 border-emerald-200 transition-colors",
                    isAnyBudgetModified ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-emerald-50 text-emerald-800"
                  )}>
                    <td colSpan={3} className="p-3 text-right">TOTAL ASIGNADO:</td>
                    <td className="p-3 text-right text-base">
                      {totalPresupuesto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className={cn(
                    "font-bold border-t border-emerald-200 transition-colors",
                    isExceeded ? "bg-red-50 text-secondary" :
                    isAnyBudgetModified ? "bg-amber-50 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  )}>
                    <td colSpan={3} className="p-3 text-right">PRESUPUESTO RESTANTE:</td>
                    <td className="p-3 text-right text-base">
                      {restante.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {isExceeded && (
                    <tr className="bg-red-100 text-secondary text-sm text-right">
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
  );
}
