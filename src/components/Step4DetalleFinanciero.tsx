"use client";

import { useState, useEffect, useRef } from "react";
import { DetalleFinanciero, RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import partidasData from "@/partidas.json";
import { cn } from "@/lib/utils";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  resultadosPrincipales: ResultadoPrincipal[];
  rows: RowData[];
  detalles: DetalleFinanciero[];
  addDetalle: (resultadoId: string) => void;
  removeDetalle: (id: string) => void;
  updateDetalle: (id: string, field: keyof DetalleFinanciero, value: string) => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
}

export function Step4DetalleFinanciero({ resultadosPrincipales, rows, detalles, addDetalle, removeDetalle, updateDetalle, handleExportPdf, handleExportExcel }: Props) {
  // Navigation grid state: tracks active cell inside step 4 tables
  const [activeCell, setActiveCell] = useState<{
    resultId: string;
    rowIndex: number;
    colIndex: number;
    isEditing: boolean;
  } | null>(null);

  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const getSuggestions = (query: string) => {
    if (!query) return partidasData.slice(0, 10);
    const cleaned = query.toLowerCase();
    return partidasData
      .filter((p: any) => 
        p.PARTIDA.toString().toLowerCase().includes(cleaned) || 
        p.DETALLE.toLowerCase().includes(cleaned)
      )
      .slice(0, 10);
  };

  // Auto-focus on adding a new detail row
  const prevDetallesLengthRef = useRef(detalles.length);
  const prevDetallesIdsRef = useRef(new Set(detalles.map(d => d.id)));

  useEffect(() => {
    if (detalles.length > prevDetallesLengthRef.current) {
      // Find the newly added detail item
      const newDetail = detalles.find(d => !prevDetallesIdsRef.current.has(d.id));
      if (newDetail) {
        // Find resDetalles for this result to calculate its row index
        const resDetalles = detalles.filter(d => d.resultadoId === newDetail.resultadoId);
        const rowIndex = resDetalles.findIndex(d => d.id === newDetail.id);
        if (rowIndex !== -1) {
          // Immediately set editing mode on the first editable column (Partida/Detalle)
          setActiveCell({ resultId: newDetail.resultadoId, rowIndex, colIndex: 0, isEditing: true });
          setTimeout(() => {
            const el = document.getElementById(`input-detail-${newDetail.id}-1`);
            if (el) {
              el.focus();
              if (el instanceof HTMLInputElement) el.select();
            }
          }, 50);
        }
      }
    }
    prevDetallesLengthRef.current = detalles.length;
    prevDetallesIdsRef.current = new Set(detalles.map(d => d.id));
  }, [detalles]);

  // Focus a specific cell td in step 4 tables
  const focusCell = (resultId: string, rowIndex: number, colIndex: number, startEditing: boolean = false) => {
    setActiveCell({ resultId, rowIndex, colIndex, isEditing: startEditing });
    setTimeout(() => {
      if (startEditing) {
        const resDetalles = detalles.filter(d => d.resultadoId === resultId);
        const detail = resDetalles[rowIndex];
        if (detail) {
          const inputEl = document.getElementById(`input-detail-${detail.id}-${colIndex + 1}`);
          if (inputEl) {
            inputEl.focus();
            if (inputEl instanceof HTMLInputElement) {
              inputEl.select();
            } else if (inputEl instanceof HTMLSelectElement && typeof (inputEl as any).showPicker === "function") {
              try {
                (inputEl as any).showPicker();
              } catch (err) {
                console.error("showPicker failed:", err);
              }
            }
          }
        }
      } else {
        const cellEl = document.getElementById(`cell-detail-${resultId}-${rowIndex}-${colIndex}`);
        cellEl?.focus();
      }
    }, 0);
  };

  const handleCellFocus = (resultId: string, rowIndex: number, colIndex: number, isEditingState: boolean) => {
    setActiveCell(prev => {
      if (prev && prev.resultId === resultId && prev.rowIndex === rowIndex && prev.colIndex === colIndex && prev.isEditing === isEditingState) {
        return prev;
      }
      return { resultId, rowIndex, colIndex, isEditing: isEditingState };
    });
  };

  // Grid level keyboard navigation (similar to Step3Matriz)
  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    resultId: string,
    rowIndex: number,
    colIndex: number,
    resDetalles: DetalleFinanciero[]
  ) => {
    if (activeCell?.isEditing) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (rowIndex > 0) {
          focusCell(resultId, rowIndex - 1, colIndex);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (rowIndex < resDetalles.length - 1) {
          focusCell(resultId, rowIndex + 1, colIndex);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) {
          focusCell(resultId, rowIndex, colIndex - 1);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < 3) {
          focusCell(resultId, rowIndex, colIndex + 1);
        }
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            focusCell(resultId, rowIndex, colIndex - 1);
          } else if (rowIndex > 0) {
            focusCell(resultId, rowIndex - 1, 3);
          }
        } else {
          if (colIndex === 3 && rowIndex === resDetalles.length - 1) {
            const btn = document.getElementById(`btn-add-detail-${resultId}`);
            btn?.focus();
            setActiveCell(null);
          } else if (colIndex < 3) {
            focusCell(resultId, rowIndex, colIndex + 1);
          } else if (rowIndex < resDetalles.length - 1) {
            focusCell(resultId, rowIndex + 1, 0);
          }
        }
        break;
      case "Enter":
        e.preventDefault();
        // Enter edit mode
        setActiveCell({ resultId, rowIndex, colIndex, isEditing: true });
        setTimeout(() => {
          const detailId = resDetalles[rowIndex].id;
          const inputEl = document.getElementById(`input-detail-${detailId}-${colIndex + 1}`);
          if (inputEl) {
            inputEl.focus();
            if (inputEl instanceof HTMLInputElement) {
              inputEl.select();
            } else if (inputEl instanceof HTMLSelectElement && typeof (inputEl as any).showPicker === "function") {
              try {
                (inputEl as any).showPicker();
              } catch (err) {
                console.error("showPicker failed:", err);
              }
            }
          }
        }, 0);
        break;
      default:
        // Support typing normal characters directly to begin editing on editable fields
        if (
          ((e.key >= "0" && e.key <= "9") ||
            (e.key >= "a" && e.key <= "z") ||
            (e.key >= "A" && e.key <= "Z") ||
            e.key === "." ||
            e.key === "-") &&
          !e.ctrlKey &&
          !e.altKey &&
          !e.metaKey
        ) {
          const detail = resDetalles[rowIndex];
          if (!detail) break;

          e.preventDefault();
          setActiveCell({ resultId, rowIndex, colIndex, isEditing: true });

          if (colIndex === 0) {
            const newValue = e.key;
            updateDetalle(detail.id, "detalle", newValue);
            const partidaCode = newValue.split(" - ")[0];
            if (partidaCode && !isNaN(Number(partidaCode))) {
              updateDetalle(detail.id, "partida", partidaCode);
            } else {
              updateDetalle(detail.id, "partida", "");
            }
            setHighlightedIndex(-1);
            setTimeout(() => {
              const inputEl = document.getElementById(`input-detail-${detail.id}-1`) as HTMLInputElement | null;
              if (inputEl) {
                inputEl.focus();
                inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
              }
            }, 0);
          } else if (colIndex === 1) {
            setTimeout(() => {
              const selectEl = document.getElementById(`input-detail-${detail.id}-2`) as HTMLSelectElement | null;
              if (selectEl) {
                selectEl.focus();
                if (typeof (selectEl as any).showPicker === "function") {
                  try {
                    (selectEl as any).showPicker();
                  } catch (err) {}
                }
              }
            }, 0);
          } else if (colIndex === 2) {
            if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
              updateDetalle(detail.id, "precioUnitario", e.key);
              setTimeout(() => {
                const inputEl = document.getElementById(`input-detail-${detail.id}-3`) as HTMLInputElement | null;
                if (inputEl) {
                  inputEl.focus();
                }
              }, 0);
            }
          } else if (colIndex === 3) {
            if (e.key >= "0" && e.key <= "9") {
              updateDetalle(detail.id, "cantidad", e.key);
              setTimeout(() => {
                const inputEl = document.getElementById(`input-detail-${detail.id}-4`) as HTMLInputElement | null;
                if (inputEl) {
                  inputEl.focus();
                }
              }, 0);
            }
          }
        }
        break;
    }
  };

  // Keyboard navigation when typing inside input fields
  const handleInputKeyDown = (
    e: React.KeyboardEvent,
    resultId: string,
    rowIndex: number,
    colIndex: number,
    resDetalles: DetalleFinanciero[]
  ) => {
    // Suggestion navigation for Partida / Detalle input
    if (colIndex === 0) {
      const query = (e.target as HTMLInputElement).value;
      const suggestions = getSuggestions(query);
      
      if (e.key === "ArrowDown") {
        if (suggestions.length > 0) {
          e.preventDefault();
          setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          return;
        }
      } else if (e.key === "ArrowUp") {
        if (suggestions.length > 0) {
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
          return;
        }
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (selected) {
          const optionVal = `${selected.PARTIDA} - ${selected.DETALLE}`;
          updateDetalle(resDetalles[rowIndex].id, "detalle", optionVal);
          updateDetalle(resDetalles[rowIndex].id, "partida", selected.PARTIDA.toString());
        }
        setHighlightedIndex(-1);
        setActiveCell({ resultId, rowIndex, colIndex, isEditing: false });
        setTimeout(() => {
          const cellEl = document.getElementById(`cell-detail-${resultId}-${rowIndex}-${colIndex}`);
          cellEl?.focus();
        }, 0);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      setActiveCell({ resultId, rowIndex, colIndex, isEditing: false });
      setTimeout(() => {
        const cellEl = document.getElementById(`cell-detail-${resultId}-${rowIndex}-${colIndex}`);
        cellEl?.focus();
        
        // Excel behavior: move right to the next column (like Tab) and start editing
        setTimeout(() => {
          if (colIndex === 3 && rowIndex === resDetalles.length - 1) {
            const btn = document.getElementById(`btn-add-detail-${resultId}`);
            btn?.focus();
            setActiveCell(null);
          } else if (colIndex < 3) {
            focusCell(resultId, rowIndex, colIndex + 1, true);
          } else if (rowIndex < resDetalles.length - 1) {
            focusCell(resultId, rowIndex + 1, 0, true);
          }
        }, 50);
      }, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveCell({ resultId, rowIndex, colIndex, isEditing: false });
      setTimeout(() => {
        const cellEl = document.getElementById(`cell-detail-${resultId}-${rowIndex}-${colIndex}`);
        cellEl?.focus();
      }, 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setActiveCell({ resultId, rowIndex, colIndex, isEditing: false });
      setTimeout(() => {
        const cellEl = document.getElementById(`cell-detail-${resultId}-${rowIndex}-${colIndex}`);
        cellEl?.focus();
        
        setTimeout(() => {
          if (e.shiftKey) {
            if (colIndex > 0) {
              focusCell(resultId, rowIndex, colIndex - 1, true);
            } else if (rowIndex > 0) {
              focusCell(resultId, rowIndex - 1, 3, true);
            }
          } else {
            if (colIndex === 3 && rowIndex === resDetalles.length - 1) {
              const btn = document.getElementById(`btn-add-detail-${resultId}`);
              btn?.focus();
              setActiveCell(null);
            } else if (colIndex < 3) {
              focusCell(resultId, rowIndex, colIndex + 1, true);
            } else if (rowIndex < resDetalles.length - 1) {
              focusCell(resultId, rowIndex + 1, 0, true);
            }
          }
        }, 0);
      }, 0);
    }
  };

  const isCellActive = (targetResultId: string, rIdx: number, cIdx: number) => {
    return !!(activeCell &&
      activeCell.resultId === targetResultId &&
      activeCell.rowIndex === rIdx &&
      activeCell.colIndex === cIdx);
  };

  const handleAddButtonKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    resultId: string,
    resDetalles: DetalleFinanciero[]
  ) => {
    if (e.key === "Tab" && e.shiftKey) {
      if (resDetalles.length > 0) {
        e.preventDefault();
        focusCell(resultId, resDetalles.length - 1, 3);
      }
    }
  };

  const getCellClassName = (
    targetResultId: string,
    rIdx: number,
    cIdx: number,
    baseClass: string = ""
  ) => {
    const active = isCellActive(targetResultId, rIdx, cIdx);
    const editing = active && activeCell?.isEditing;

    return cn(
      baseClass,
      "relative transition-all focus:outline-none focus-visible:outline-none",
      !active && "hover:bg-emerald-50 cursor-pointer transition-colors duration-100",
      active && !editing && "ring-2 ring-inset ring-emerald-600 bg-emerald-50/40 z-10",
      editing && "ring-2 ring-inset ring-emerald-500 bg-white z-10"
    );
  };

  return (
    <div className="w-full space-y-6">
      <datalist id="detalles-list">
        {partidasData.map((p: any) => (
          <option key={`d-${p.PARTIDA}`} value={`${p.PARTIDA} - ${p.DETALLE}`}>
            {p.PARTIDA} - {p.DETALLE}
          </option>
        ))}
      </datalist>
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
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors text-sm font-bold shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 space-y-10 min-w-0">
        {resultadosPrincipales.map((rp, rpIndex) => {
          const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);

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
                  
                  const totalEgresos = resDetalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
                  const presupuestoAsignado = Number(result.presupuesto) || 0;
                  const isExceeded = totalEgresos > presupuestoAsignado;

                  return (
                    <div key={result.id} className="border border-slate-300 rounded-lg shadow-sm bg-white overflow-hidden">
                      <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                          <span className="bg-slate-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                            {rpIndex + 1}.{riIndex + 1}
                          </span>
                          {resName}
                        </h4>
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
                                <th className="p-2 border-r border-slate-200 font-semibold text-left">Partida / Detalle</th>
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
                                    <td className="p-1 border-r border-slate-200 text-center text-sm text-slate-500">
                                      {dIndex + 1}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 text-center font-bold text-sm text-secondary">
                                      Gasto
                                    </td>
                                    
                                    {/* Column 0: Partida / Detalle */}
                                    <td
                                      id={`cell-detail-${result.id}-${dIndex}-0`}
                                      tabIndex={0}
                                      onFocus={() => handleCellFocus(result.id, dIndex, 0, false)}
                                      onKeyDown={(e) => handleCellKeyDown(e, result.id, dIndex, 0, resDetalles)}
                                      onDoubleClick={() => {
                                        setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 0, isEditing: true });
                                        setTimeout(() => {
                                          const el = document.getElementById(`input-detail-${detalle.id}-1`);
                                          if (el) {
                                            el.focus();
                                            if (el instanceof HTMLInputElement) el.select();
                                          }
                                        }, 0);
                                      }}
                                      className={getCellClassName(result.id, dIndex, 0, "p-0 border-r border-slate-200 align-middle")}
                                    >
                                      <input
                                        id={`input-detail-${detalle.id}-1`}
                                        tabIndex={-1}
                                        type="text"
                                        className="w-full h-full min-h-[40px] p-2 bg-transparent outline-none border-0 focus:ring-0 focus:border-0 text-sm uppercase"
                                        value={detalle.detalle}
                                        placeholder="Ej: 21100 - COMUNICACIONES"
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateDetalle(detalle.id, "detalle", val);
                                          const partidaCode = val.split(" - ")[0];
                                          if (partidaCode && !isNaN(Number(partidaCode))) {
                                            updateDetalle(detalle.id, "partida", partidaCode);
                                          } else {
                                            updateDetalle(detalle.id, "partida", "");
                                          }
                                          setHighlightedIndex(-1);
                                        }}
                                        onFocus={(e) => {
                                          e.stopPropagation();
                                          setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 0, isEditing: true });
                                        }}
                                        onKeyDown={(e) => handleInputKeyDown(e, result.id, dIndex, 0, resDetalles)}
                                      />
                                      {isCellActive(result.id, dIndex, 0) && activeCell?.isEditing && (
                                        <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-xl z-50 divide-y divide-slate-100">
                                          {getSuggestions(detalle.detalle).map((p: any, sIdx: number) => {
                                            const optionVal = `${p.PARTIDA} - ${p.DETALLE}`;
                                            const isHighlighted = sIdx === highlightedIndex;
                                            return (
                                              <div
                                                key={p.PARTIDA}
                                                className={cn(
                                                  "px-3 py-2 text-left text-xs cursor-pointer transition-colors font-medium flex items-center",
                                                  isHighlighted ? "bg-primary text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                                                )}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  updateDetalle(detalle.id, "detalle", optionVal);
                                                  updateDetalle(detalle.id, "partida", p.PARTIDA.toString());
                                                  setHighlightedIndex(-1);
                                                  setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 0, isEditing: false });
                                                  setTimeout(() => {
                                                    const cellEl = document.getElementById(`cell-detail-${result.id}-${dIndex}-0`);
                                                    cellEl?.focus();
                                                  }, 0);
                                                }}
                                              >
                                                <span className={cn("font-mono font-bold mr-1.5 shrink-0", isHighlighted ? "text-white" : "text-primary")}>{p.PARTIDA}</span>
                                                <span className="truncate">{p.DETALLE}</span>
                                              </div>
                                            );
                                          })}
                                          {getSuggestions(detalle.detalle).length === 0 && (
                                            <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">
                                              Sin coincidencias
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Column 1: Mes */}
                                    <td
                                      id={`cell-detail-${result.id}-${dIndex}-1`}
                                      tabIndex={0}
                                      onFocus={() => handleCellFocus(result.id, dIndex, 1, false)}
                                      onKeyDown={(e) => handleCellKeyDown(e, result.id, dIndex, 1, resDetalles)}
                                      onDoubleClick={() => {
                                        setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 1, isEditing: true });
                                        setTimeout(() => {
                                          const el = document.getElementById(`input-detail-${detalle.id}-2`);
                                          if (el) {
                                            el.focus();
                                            if (el instanceof HTMLSelectElement && typeof (el as any).showPicker === "function") {
                                              try {
                                                (el as any).showPicker();
                                              } catch (err) {}
                                            }
                                          }
                                        }, 0);
                                      }}
                                      className={getCellClassName(result.id, dIndex, 1, "p-0 border-r border-slate-200 align-middle")}
                                    >
                                      <select 
                                        id={`input-detail-${detalle.id}-2`}
                                        tabIndex={-1}
                                        className="w-full h-full min-h-[40px] p-2 border-none bg-transparent outline-none focus:ring-0 focus:border-0 text-sm text-center"
                                        value={detalle.mes}
                                        onChange={(e) => updateDetalle(detalle.id, "mes", e.target.value)}
                                        onFocus={(e) => {
                                          e.stopPropagation();
                                          setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 1, isEditing: true });
                                        }}
                                        onKeyDown={(e) => handleInputKeyDown(e, result.id, dIndex, 1, resDetalles)}
                                      >
                                        {months.map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* Column 2: Precio Unitario */}
                                    <td
                                      id={`cell-detail-${result.id}-${dIndex}-2`}
                                      tabIndex={0}
                                      onFocus={() => handleCellFocus(result.id, dIndex, 2, false)}
                                      onKeyDown={(e) => handleCellKeyDown(e, result.id, dIndex, 2, resDetalles)}
                                      onDoubleClick={() => {
                                        setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 2, isEditing: true });
                                        setTimeout(() => {
                                          const el = document.getElementById(`input-detail-${detalle.id}-3`);
                                          if (el) {
                                            el.focus();
                                            if (el instanceof HTMLInputElement) el.select();
                                          }
                                        }, 0);
                                      }}
                                      className={getCellClassName(result.id, dIndex, 2, "p-0 border-r border-slate-200 align-middle")}
                                    >
                                      <input
                                        id={`input-detail-${detalle.id}-3`}
                                        tabIndex={-1}
                                        type="number"
                                        className="w-full h-full min-h-[40px] p-2 text-right bg-transparent outline-none border-0 focus:ring-0 focus:border-0 text-sm font-medium"
                                        value={detalle.precioUnitario}
                                        placeholder="0.00"
                                        onChange={(e) => updateDetalle(detalle.id, "precioUnitario", e.target.value)}
                                        onFocus={(e) => {
                                          e.stopPropagation();
                                          setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 2, isEditing: true });
                                        }}
                                        onKeyDown={(e) => handleInputKeyDown(e, result.id, dIndex, 2, resDetalles)}
                                      />
                                    </td>

                                    {/* Column 3: Cantidad */}
                                    <td
                                      id={`cell-detail-${result.id}-${dIndex}-3`}
                                      tabIndex={0}
                                      onFocus={() => handleCellFocus(result.id, dIndex, 3, false)}
                                      onKeyDown={(e) => handleCellKeyDown(e, result.id, dIndex, 3, resDetalles)}
                                      onDoubleClick={() => {
                                        setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 3, isEditing: true });
                                        setTimeout(() => {
                                          const el = document.getElementById(`input-detail-${detalle.id}-4`);
                                          if (el) {
                                            el.focus();
                                            if (el instanceof HTMLInputElement) el.select();
                                          }
                                        }, 0);
                                      }}
                                      className={getCellClassName(result.id, dIndex, 3, "p-0 border-r border-slate-200 align-middle")}
                                    >
                                      <input
                                        id={`input-detail-${detalle.id}-4`}
                                        tabIndex={-1}
                                        type="number"
                                        className="w-full h-full min-h-[40px] p-2 text-right bg-transparent outline-none border-0 focus:ring-0 focus:border-0 text-sm"
                                        value={detalle.cantidad}
                                        placeholder="0"
                                        onChange={(e) => updateDetalle(detalle.id, "cantidad", e.target.value)}
                                        onFocus={(e) => {
                                          e.stopPropagation();
                                          setActiveCell({ resultId: result.id, rowIndex: dIndex, colIndex: 3, isEditing: true });
                                        }}
                                        onKeyDown={(e) => handleInputKeyDown(e, result.id, dIndex, 3, resDetalles)}
                                      />
                                    </td>

                                    <td className={`p-2 border-r border-slate-200 text-right font-bold text-sm ${isIngreso ? 'text-emerald-700 bg-emerald-50/30' : 'text-secondary bg-red-50/20'}`}>
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
                              <tr className={cn("font-bold border-t-2 border-slate-300", isExceeded ? "bg-red-50 text-secondary" : "bg-emerald-50 text-emerald-800")}>
                                <td colSpan={6} className="p-2 text-right text-sm uppercase">
                                  Presupuesto Asignado (Bs):
                                </td>
                                <td className="p-2 text-right text-sm">
                                  {presupuestoAsignado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td>
                              </tr>
                              {totalEgresos > 0 && (
                                <tr className="bg-slate-100 font-bold border-t border-slate-200">
                                  <td colSpan={6} className="p-2 text-right text-slate-700 text-sm uppercase">
                                    Total Gastos Programados (Bs):
                                  </td>
                                  <td className={cn("p-2 text-right text-sm", isExceeded ? "text-secondary" : "text-emerald-700")}>
                                    {totalEgresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td></td>
                                </tr>
                              )}
                              <tr className={cn("font-bold border-t border-slate-200", isExceeded ? "bg-red-100 text-secondary" : "bg-emerald-100 text-emerald-800")}>
                                <td colSpan={6} className="p-2 text-right text-sm uppercase">
                                  Presupuesto Restante (Bs):
                                </td>
                                <td className="p-2 text-right text-sm">
                                  {(presupuestoAsignado - totalEgresos).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td>
                              </tr>
                              {isExceeded && (
                                <tr className="bg-red-100 text-secondary text-sm text-right">
                                  <td colSpan={8} className="p-2 font-bold">
                                    ⚠️ El total de gastos supera el presupuesto asignado para este resultado intermedio.
                                  </td>
                                </tr>
                              )}
                            </tfoot>
                          </table>
                        </div>
                      )}
                      
                      <div className="p-3 bg-slate-50 border-t border-slate-300">
                        <button 
                          id={`btn-add-detail-${result.id}`}
                          onClick={() => addDetalle(result.id)}
                          onKeyDown={(e) => handleAddButtonKeyDown(e, result.id, resDetalles)}
                          className="flex items-center gap-2 bg-white text-secondary border border-secondary px-3 py-1.5 rounded-md hover:bg-secondary hover:text-white transition-colors text-sm font-bold shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Añadir Gasto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-80 shrink-0 sticky top-6 bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm max-h-[90vh] overflow-y-auto">
          <h3 className="font-bold text-primary border-b border-slate-200 pb-2 mb-4">
            Programación Física (Referencia Mensual)
          </h3>
          <div className="space-y-6">
            {resultadosPrincipales.map((rp, rpIndex) => {
              const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
              if (rpRows.length === 0) return null;

              return (
                <div key={rp.id}>
                  <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">{rpIndex + 1}. {rp.resultado || "Resultado"}</h4>
                  <div className="space-y-3">
                    {rpRows.map((row, riIndex) => {
                      const total = row.meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
                      return (
                        <div key={row.id} className="bg-white border border-slate-200 rounded p-2 text-sm shadow-sm">
                          <div className="font-bold text-primary mb-1">
                            {rpIndex + 1}.{riIndex + 1} {row.producto || "Sin definir"}
                          </div>
                          <div className="grid grid-cols-6 gap-1 mt-2 text-center text-sm">
                            {months.map((m, idx) => {
                              const val = Number(row.meses[idx]) || 0;
                              return (
                                <div key={m} className={cn("p-1 rounded flex flex-col items-center justify-center", val > 0 ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-slate-100 text-slate-400")}>
                                  <div>{m}</div>
                                  <div>{val}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 text-right text-sm font-bold text-slate-500">
                            Total: {total}{row.tipo === "Porcentual" ? "%" : ""}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
