"use client";

import { useState, useEffect } from "react";
import { RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText, ZoomIn, SlidersHorizontal, Building2, GraduationCap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step3PresupuestoGlobal } from "./Step3PresupuestoGlobal";

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

interface ActiveCell {
  tableType: "matriz" | "presupuesto";
  rpId?: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
}

const zoomClass = {
  normal: "text-sm",
  large: "text-base [&_input]:text-base [&_select]:text-base [&_textarea]:text-base",
  xlarge: "text-lg [&_input]:text-lg [&_select]:text-lg [&_textarea]:text-lg [&_td]:p-3 [&_th]:p-3 [&_button]:scale-110"
};

const colWidths = {
  normal: {
    no: "w-14",
    intermedio: "w-44",
    indicador: "w-32",
    tipo: "w-24",
    month: "w-10",
    total: "w-16",
    action: "w-10"
  },
  large: {
    no: "w-16",
    intermedio: "w-52",
    indicador: "w-40",
    tipo: "w-28",
    month: "w-12",
    total: "w-20",
    action: "w-12"
  },
  xlarge: {
    no: "w-24",
    intermedio: "w-64",
    indicador: "w-48",
    tipo: "w-32",
    month: "w-20",
    total: "w-28",
    action: "w-16"
  }
};

export function Step3Matriz({ resultadosPrincipales, rows, addRowGroup, removeRowGroup, updateRow, updateMonth, handleExportPdf }: Props) {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [zoomLevel, setZoomLevel] = useState<"normal" | "large" | "xlarge">("normal");
  const [modalEditRowId, setModalEditRowId] = useState<string | null>(null);

  // Track modified cells to display orange warning flags
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set());

  // Non-editable cell warning alert
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningTimeout, setWarningTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerWarning = () => {
    setWarningMessage("No puedes modificar este dato");
  };

  // Auto-fade warning message
  useEffect(() => {
    if (warningMessage) {
      if (warningTimeout) clearTimeout(warningTimeout);
      const timeout = setTimeout(() => {
        setWarningMessage(null);
      }, 2500);
      setWarningTimeout(timeout);
    }
    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
    };
  }, [warningMessage]);

  const calculateTotal = (meses: string[]) => {
    return meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  // Wrapped update callbacks to log changes
  const handleUpdateMonth = (rowIndex: number, monthIndex: number, value: string) => {
    const row = rows[rowIndex];
    if (row) {
      setModifiedCells(prev => {
        const next = new Set(prev);
        next.add(`month-${row.id}-${monthIndex}`);
        next.add(`row-total-${row.id}`); // mark the total cell as modified
        return next;
      });
    }
    updateMonth(rowIndex, monthIndex, value);
  };

  const handleUpdateRow = (rowIndex: number, field: keyof RowData, value: string) => {
    const row = rows[rowIndex];
    if (row) {
      setModifiedCells(prev => {
        const next = new Set(prev);
        if (field === "presupuesto") {
          next.add(`budget-${row.id}`);
        } else {
          next.add(`${String(field)}-${row.id}`);
        }
        return next;
      });
    }
    updateRow(rowIndex, field, value);
  };

  // Build list of active tables for navigation sequence
  const tablesList = [
    ...resultadosPrincipales.map(rp => ({ type: "matriz" as const, rpId: rp.id })),
    { type: "presupuesto" as const, rpId: undefined }
  ];

  const focusCell = (tableType: "matriz" | "presupuesto", rpId: string | undefined, rowIndex: number, colIndex: number) => {
    const id = tableType === "matriz"
      ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
      : `cell-presupuesto-${rowIndex}-${colIndex}`;
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  };

  const navigateGrid = (direction: "up" | "down" | "left" | "right" | "next" | "prev") => {
    if (!activeCell) return;

    const { tableType, rpId, rowIndex, colIndex } = activeCell;
    const currentTableIndex = tablesList.findIndex(t => t.type === tableType && t.rpId === rpId);
    if (currentTableIndex === -1) return;

    const currentTable = tablesList[currentTableIndex];

    const getRowsCount = (t: typeof tablesList[0]) => {
      if (t.type === "matriz") {
        return rows.filter(r => r.resultadoPrincipalId === t.rpId).length;
      }
      return rows.length;
    };

    const getColsCount = (t: typeof tablesList[0]) => {
      return t.type === "matriz" ? 18 : 4;
    };

    let nextTableIndex = currentTableIndex;
    let nextRowIndex = rowIndex;
    let nextColIndex = colIndex;

    if (direction === "left") {
      if (colIndex > 0) {
        nextColIndex = colIndex - 1;
      }
    } else if (direction === "right") {
      const colsCount = getColsCount(currentTable);
      if (colIndex < colsCount - 1) {
        nextColIndex = colIndex + 1;
      }
    } else if (direction === "up") {
      if (rowIndex > 0) {
        nextRowIndex = rowIndex - 1;
      } else if (currentTableIndex > 0) {
        let prevIdx = currentTableIndex - 1;
        while (prevIdx >= 0) {
          const prevTable = tablesList[prevIdx];
          const rCount = getRowsCount(prevTable);
          if (rCount > 0) {
            nextTableIndex = prevIdx;
            nextRowIndex = rCount - 1;
            nextColIndex = Math.min(colIndex, getColsCount(prevTable) - 1);
            break;
          }
          prevIdx--;
        }
      }
    } else if (direction === "down") {
      const rowsCount = getRowsCount(currentTable);
      if (rowIndex < rowsCount - 1) {
        nextRowIndex = rowIndex + 1;
      } else if (currentTableIndex < tablesList.length - 1) {
        let nextIdx = currentTableIndex + 1;
        while (nextIdx < tablesList.length) {
          const nextTable = tablesList[nextIdx];
          const rCount = getRowsCount(nextTable);
          if (rCount > 0) {
            nextTableIndex = nextIdx;
            nextRowIndex = 0;
            nextColIndex = Math.min(colIndex, getColsCount(nextTable) - 1);
            break;
          }
          nextIdx++;
        }
      }
    } else if (direction === "next") {
      const colsCount = getColsCount(currentTable);
      if (colIndex < colsCount - 1) {
        nextColIndex = colIndex + 1;
      } else {
        const rowsCount = getRowsCount(currentTable);
        if (rowIndex < rowsCount - 1) {
          nextRowIndex = rowIndex + 1;
          nextColIndex = 0;
        } else if (currentTableIndex < tablesList.length - 1) {
          let nextIdx = currentTableIndex + 1;
          while (nextIdx < tablesList.length) {
            const nextTable = tablesList[nextIdx];
            const rCount = getRowsCount(nextTable);
            if (rCount > 0) {
              nextTableIndex = nextIdx;
              nextRowIndex = 0;
              nextColIndex = 0;
              break;
            }
            nextIdx++;
          }
        }
      }
    } else if (direction === "prev") {
      if (colIndex > 0) {
        nextColIndex = colIndex - 1;
      } else {
        if (rowIndex > 0) {
          nextRowIndex = rowIndex - 1;
          nextColIndex = getColsCount(currentTable) - 1;
        } else if (currentTableIndex > 0) {
          let prevIdx = currentTableIndex - 1;
          while (prevIdx >= 0) {
            const prevTable = tablesList[prevIdx];
            const rCount = getRowsCount(prevTable);
            if (rCount > 0) {
              nextTableIndex = prevIdx;
              nextRowIndex = rCount - 1;
              nextColIndex = getColsCount(prevTable) - 1;
              break;
            }
            prevIdx--;
          }
        }
      }
    }

    const targetTable = tablesList[nextTableIndex];
    focusCell(targetTable.type, targetTable.rpId, nextRowIndex, nextColIndex);
  };

  const handleCellFocus = (tableType: "matriz" | "presupuesto", rpId: string | undefined, rowIndex: number, colIndex: number, isEditingState: boolean = false) => {
    setActiveCell(prev => {
      // Avoid duplicate state sets if nothing changed
      if (prev && prev.tableType === tableType && prev.rpId === rpId && prev.rowIndex === rowIndex && prev.colIndex === colIndex && prev.isEditing === isEditingState) {
        return prev;
      }
      return { tableType, rpId, rowIndex, colIndex, isEditing: isEditingState };
    });
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number,
    isEditable: boolean,
    rowId: string,
    absoluteIndex: number
  ) => {
    if (activeCell?.isEditing) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigateGrid("up");
        break;
      case "ArrowDown":
        e.preventDefault();
        navigateGrid("down");
        break;
      case "ArrowLeft":
        e.preventDefault();
        navigateGrid("left");
        break;
      case "ArrowRight":
        e.preventDefault();
        navigateGrid("right");
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          navigateGrid("prev");
        } else {
          navigateGrid("next");
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isEditable) {
          setActiveCell({ tableType, rpId, rowIndex, colIndex, isEditing: true });
          setTimeout(() => {
            const inputId = tableType === "matriz"
              ? `input-matriz-${rpId}-${rowIndex}-${colIndex}`
              : `input-presupuesto-${rowIndex}-${colIndex}`;
            const input = document.getElementById(inputId);
            if (input) {
              (input as any).focus();
              if ((input as any).select) {
                (input as any).select();
              }
            }
          }, 0);
        } else if (tableType === "matriz" && colIndex === 17) {
          removeRowGroup(absoluteIndex);
        } else {
          // Attempting to edit non-editable cells via keyboard Enter
          triggerWarning();
        }
        break;
      case "Escape":
        e.preventDefault();
        const cellId = tableType === "matriz"
          ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
          : `cell-presupuesto-${rowIndex}-${colIndex}`;
        document.getElementById(cellId)?.blur();
        setActiveCell(null);
        break;
      default:
        // Support typing numbers directly to begin editing on editable numeric fields
        if (tableType === "matriz" && colIndex >= 4 && colIndex <= 15 && e.key >= "0" && e.key <= "9") {
          e.preventDefault();
          setActiveCell({ tableType, rpId, rowIndex, colIndex, isEditing: true });
          handleUpdateMonth(absoluteIndex, colIndex - 4, e.key);
          setTimeout(() => {
            const inputId = `input-matriz-${rpId}-${rowIndex}-${colIndex}`;
            const input = document.getElementById(inputId) as HTMLInputElement | null;
            if (input) {
              input.focus();
              input.select();
            }
          }, 0);
        } else if (tableType === "presupuesto" && colIndex === 3 && e.key >= "0" && e.key <= "9") {
          e.preventDefault();
          setActiveCell({ tableType, rpId, rowIndex, colIndex, isEditing: true });
          handleUpdateRow(absoluteIndex, "presupuesto", e.key);
          setTimeout(() => {
            const inputId = `input-presupuesto-${rowIndex}-${colIndex}`;
            const input = document.getElementById(inputId) as HTMLInputElement | null;
            if (input) {
              input.focus();
              input.select();
            }
          }, 0);
        } else if (((e.key >= "0" && e.key <= "9") || e.key.length === 1) && !e.ctrlKey && !e.altKey && !e.metaKey) {
          // Attempting to type normal characters on any non-editable cell
          triggerWarning();
        }
        break;
    }
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent,
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName.toLowerCase() === "textarea";

      if (isTextarea && e.shiftKey) {
        return; // Allow newline on Shift+Enter in textarea
      }

      e.preventDefault();
      setActiveCell(prev => prev ? { ...prev, isEditing: false } : null);

      const cellId = tableType === "matriz"
        ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
        : `cell-presupuesto-${rowIndex}-${colIndex}`;
      document.getElementById(cellId)?.focus();

      // Excel behavior: move down one cell
      setTimeout(() => {
        navigateGrid("down");
      }, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveCell(prev => prev ? { ...prev, isEditing: false } : null);
      const cellId = tableType === "matriz"
        ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
        : `cell-presupuesto-${rowIndex}-${colIndex}`;
      document.getElementById(cellId)?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      setActiveCell(prev => prev ? { ...prev, isEditing: false } : null);
      const cellId = tableType === "matriz"
        ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
        : `cell-presupuesto-${rowIndex}-${colIndex}`;
      document.getElementById(cellId)?.focus();

      setTimeout(() => {
        if (e.shiftKey) {
          navigateGrid("prev");
        } else {
          navigateGrid("next");
        }
      }, 0);
    }
  };

  const isCellActive = (type: "matriz" | "presupuesto", targetRpId: string | undefined, rIdx: number, cIdx: number) => {
    return !!(activeCell &&
      activeCell.tableType === type &&
      activeCell.rpId === targetRpId &&
      activeCell.rowIndex === rIdx &&
      activeCell.colIndex === cIdx);
  };

  const isRowActive = (type: "matriz" | "presupuesto", targetRpId: string | undefined, rIdx: number) => {
    return !!(activeCell &&
      activeCell.tableType === type &&
      activeCell.rpId === targetRpId &&
      activeCell.rowIndex === rIdx);
  };

  const isColActive = (type: "matriz" | "presupuesto", targetRpId: string | undefined, cIdx: number) => {
    return !!(activeCell &&
      activeCell.tableType === type &&
      activeCell.rpId === targetRpId &&
      activeCell.colIndex === cIdx);
  };

  const getCellClassName = (
    type: "matriz" | "presupuesto",
    targetRpId: string | undefined,
    rIdx: number,
    cIdx: number,
    isEditable: boolean,
    isModified: boolean,
    baseClass: string = ""
  ) => {
    const active = isCellActive(type, targetRpId, rIdx, cIdx);
    const editing = active && activeCell?.isEditing;

    // Crosshair row / col checks
    const activeRow = activeCell && activeCell.tableType === type && activeCell.rpId === targetRpId && activeCell.rowIndex === rIdx;
    const activeCol = activeCell && activeCell.tableType === type && activeCell.rpId === targetRpId && activeCell.colIndex === cIdx;

    return cn(
      baseClass,
      "relative transition-all focus:outline-none focus-visible:outline-none",
      // Hover highlight for editable cells when not active/modified
      isEditable && !active && !isModified && "hover:bg-emerald-50 hover:text-emerald-955 cursor-pointer transition-colors duration-100",
      // Modified cell highlight (orange background + orange text)
      isModified && !active && "bg-amber-50/80 text-amber-900 font-semibold border-amber-200",
      // Crosshair highlight
      (activeRow || activeCol) && !active && !isModified && (type === "matriz" ? "bg-primary/[0.03]" : "bg-emerald-500/[0.03]"),
      // Selected/focused cell highlight (emerald green ring + soft green background) - ONLY when not editing!
      active && !editing && "ring-2 ring-inset ring-emerald-600 bg-emerald-50/40 z-10",
      // Editing cell highlight (emerald ring) - ONLY when editing!
      editing && "ring-2 ring-inset ring-emerald-500 bg-white z-10"
    );
  };

  const getHudDetails = () => {
    if (!activeCell) return null;
    const { tableType, rpId, rowIndex, colIndex } = activeCell;

    if (tableType === "matriz") {
      const rpIndex = resultadosPrincipales.findIndex(rp => rp.id === rpId);
      const rpRows = rows.filter(r => r.resultadoPrincipalId === rpId);
      const row = rpRows[rowIndex];
      if (!row) return null;

      const rowNum = `${rpIndex + 1}.${rowIndex + 1}`;
      const rowName = row.producto || row.productoSelect || "Resultado Intermedio (Sin definir)";

      let colName = "";
      let val = "";
      if (colIndex === 0) {
        colName = "Número de Fila";
        val = rowNum;
      } else if (colIndex === 1) {
        colName = "Resultado Intermedio";
        val = row.productoSelect === "Otro (Personalizado)" ? row.producto : row.productoSelect || "Sin definir";
      } else if (colIndex === 2) {
        colName = "Indicador";
        val = row.indicador || "Sin definir";
      } else if (colIndex === 3) {
        colName = "Tipo de Meta";
        val = row.tipo;
      } else if (colIndex >= 4 && colIndex <= 15) {
        colName = `Meta Mensual - ${months[colIndex - 4]}`;
        val = `${row.meses[colIndex - 4] || "0"} ${row.tipo === "Porcentual" ? "%" : "unidades"}`;
      } else if (colIndex === 16) {
        colName = "Total de Meta";
        val = `${calculateTotal(row.meses).toLocaleString()} ${row.tipo === "Porcentual" ? "%" : "unidades"}`;
      } else if (colIndex === 17) {
        colName = "Acción de Fila";
        val = row.isMandatory ? "Celda Obligatoria" : "Eliminar Fila";
      }

      return { rowNum, rowName, colName, val, isBudget: false };
    } else {
      const row = rows[rowIndex];
      if (!row) return null;

      const rpIndex = resultadosPrincipales.findIndex(rp => rp.id === row.resultadoPrincipalId);
      const rpRows = rows.filter(r => r.resultadoPrincipalId === row.resultadoPrincipalId);
      const relativeIndex = rpRows.findIndex(r => r.id === row.id);
      const rpName = resultadosPrincipales[rpIndex]?.resultado || `Resultado Principal ${rpIndex + 1}`;

      const rowNum = `${rpIndex + 1}.${relativeIndex + 1}`;
      const rowName = row.producto || "Resultado Intermedio (Sin definir)";

      let colName = "";
      let val = "";
      if (colIndex === 0) {
        colName = "Número de Fila";
        val = rowNum;
      } else if (colIndex === 1) {
        colName = "Resultado Principal";
        val = rpName;
      } else if (colIndex === 2) {
        colName = "Resultado Intermedio";
        val = rowName;
      } else if (colIndex === 3) {
        colName = "Presupuesto Asignado";
        const amount = Number(row.presupuesto) || 0;
        val = `Bs. ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      return { rowNum, rowName, colName, val, isBudget: true };
    }
  };

  const modalRow = rows.find(r => r.id === modalEditRowId);
  const modalAbsoluteIndex = rows.findIndex(r => r.id === modalEditRowId);
  const modalRp = modalRow ? resultadosPrincipales.find(rp => rp.id === modalRow.resultadoPrincipalId) : null;
  const modalRpIndex = modalRp ? resultadosPrincipales.findIndex(rp => rp.id === modalRp.id) : -1;
  const modalRpRows = modalRow ? rows.filter(r => r.resultadoPrincipalId === modalRow.resultadoPrincipalId) : [];
  const modalRelativeIndex = modalRow ? modalRpRows.findIndex(r => r.id === modalRow.id) : -1;
  const modalRowNum = modalRpIndex !== -1 && modalRelativeIndex !== -1 ? `${modalRpIndex + 1}.${modalRelativeIndex + 1}` : "";

  // Dynamic widths selection based on zoom scale
  const widthClass = colWidths[zoomLevel];

  return (
    <div className="w-full space-y-6 relative">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-primary" />
              3. Matriz de Ejecución e Ingresos/Egresos
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Defina los resultados intermedios asociados. Use flechas para navegar y Enter para editar. Haga clic en la lupa (🔍) en el N° de fila para abrir la edición accesible.
            </p>
          </div>
          
          {/* Action Dock (Zoom + export PDF) */}
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            {/* Font Zoom controls */}
            <div className="bg-slate-50 p-1.5 rounded-xl flex items-center border border-slate-200 gap-1.5 shadow-inner">
              <span className="text-xs font-bold text-slate-500 px-2.5 uppercase select-none tracking-wider font-sans">Zoom</span>
              <button
                onClick={() => setZoomLevel("normal")}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer",
                  zoomLevel === "normal" ? "bg-white text-primary shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
                )}
                title="Tamaño normal"
              >
                A
              </button>
              <button
                onClick={() => setZoomLevel("large")}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer",
                  zoomLevel === "large" ? "bg-white text-primary shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
                )}
                title="Tamaño grande"
              >
                A+
              </button>
              <button
                onClick={() => setZoomLevel("xlarge")}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer",
                  zoomLevel === "xlarge" ? "bg-white text-primary shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
                )}
                title="Tamaño muy grande"
              >
                A++
              </button>
            </div>
            
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-sm active:scale-95 cursor-pointer ml-auto xl:ml-0"
            >
              <FileText className="w-4 h-4 text-secondary" /> Generar PDF
            </button>
          </div>
        </div>

        {/* Dashboard Budget Cards Deck */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: General Budget */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
            <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Techo Presupuestario General</p>
              <p className="text-xl font-black text-slate-800 mt-1 font-mono">Bs. 5,000,000.00</p>
            </div>
          </div>

          {/* Card 2: Career Budget */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 border border-emerald-100 p-4 rounded-xl flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Techo Presupuestario Carrera</p>
              <p className="text-xl font-black text-emerald-800 mt-1 font-mono">Bs. 1,200,000.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Cell HUD */}
      {(() => {
        const hud = getHudDetails();
        return (
          <div className={cn(
            "bg-white border shadow-md rounded-2xl overflow-hidden transition-all duration-300 ring-4 ring-offset-2",
            hud 
              ? (hud.isBudget ? "border-emerald-300 ring-emerald-100" : "border-primary/40 ring-primary/5") 
              : "border-slate-200 ring-transparent"
          )}>
            {!hud ? (
              <div className="p-5 flex items-center gap-3 bg-slate-50/60 text-slate-500 text-sm font-medium">
                <Info className="w-5 h-5 text-primary/70 animate-pulse shrink-0" />
                <span>Modo de visualización asistida activo. Haga clic en cualquier celda para ver sus datos con zoom de alta visibilidad.</span>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Left side: Context details & Description */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-sm border",
                        hud.isBudget 
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800" 
                          : "bg-primary text-white border-primary"
                      )}>
                        {hud.isBudget ? "Techo Presupuestario" : "Meta Física / Ejecución"}
                      </span>
                      <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700 font-mono">
                        Ubicación: Fila {hud.rowNum}
                      </span>
                      <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                        Columna: {hud.colName}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Descripción del Resultado Intermedio</p>
                      <p className="text-slate-800 font-extrabold text-lg md:text-xl leading-relaxed">
                        {hud.rowName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-6 lg:w-[320px] flex flex-col justify-center items-center lg:items-end shrink-0 select-all transition-colors",
                  hud.isBudget ? "bg-emerald-50/50" : "bg-primary/5"
                )}>
                  <div 
                    className={cn(
                      "font-black tracking-tight font-mono drop-shadow-sm py-2 text-center lg:text-right w-full break-all",
                      hud.isBudget ? "text-emerald-800" : "text-primary"
                    )}
                    style={{ fontSize: "4.5rem", lineHeight: "1" }}
                  >
                    {hud.val}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-8">
        {resultadosPrincipales.map((rp, rpIndex) => {
          const rpName = rp.resultado || `Resultado Principal ${rpIndex + 1} (Sin definir)`;
          const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);

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
                  <div className={cn("overflow-x-auto transition-all duration-200", zoomClass[zoomLevel])}>
                    <table className="w-full border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <th className={cn(
                            "p-2 border-r border-slate-200 font-semibold text-center transition-colors duration-150",
                            widthClass.no,
                            isColActive("matriz", rp.id, 0) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>N°</th>
                          <th className={cn(
                            "p-2 border-r border-slate-200 font-semibold text-left transition-colors duration-150",
                            widthClass.intermedio,
                            isColActive("matriz", rp.id, 1) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>Resultado Intermedio</th>
                          <th className={cn(
                            "p-2 border-r border-slate-200 font-semibold text-left transition-colors duration-150",
                            widthClass.indicador,
                            isColActive("matriz", rp.id, 2) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>Indicador</th>
                          <th className={cn(
                            "p-2 border-r border-slate-200 font-semibold text-center transition-colors duration-150",
                            widthClass.tipo,
                            isColActive("matriz", rp.id, 3) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>Tipo de Meta</th>
                          {months.map((m, mIndex) => {
                            const cIdx = 4 + mIndex;
                            const active = isColActive("matriz", rp.id, cIdx);
                            return (
                              <th
                                key={m}
                                className={cn(
                                  "p-2 border-r border-slate-200 font-semibold text-center transition-colors duration-150",
                                  widthClass.month,
                                  active ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                                )}
                              >
                                {m}
                              </th>
                            );
                          })}
                          <th className={cn(
                            "p-2 border-r border-slate-200 font-semibold text-center transition-colors duration-150",
                            widthClass.total,
                            isColActive("matriz", rp.id, 16) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>Total</th>
                          <th className={cn(
                            "p-2 font-semibold text-center transition-colors duration-150",
                            widthClass.action,
                            isColActive("matriz", rp.id, 17) ? "bg-emerald-200/80 text-emerald-900 font-bold" : ""
                          )}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpRows.map((row, relativeIndex) => {
                          const absoluteIndex = rows.findIndex(r => r.id === row.id);
                          const isEvenGroup = relativeIndex % 2 === 0;
                          const groupBg = isEvenGroup ? "bg-white" : "bg-slate-50";
                          const rowActive = isRowActive("matriz", rp.id, relativeIndex);

                          // Individual modification checks
                          const isProdModified = modifiedCells.has(`producto-${row.id}`) || modifiedCells.has(`productoSelect-${row.id}`);
                          const isIndModified = modifiedCells.has(`indicador-${row.id}`);
                          const isTipoModified = modifiedCells.has(`tipo-${row.id}`);
                          const isRowModified = modifiedCells.has(`row-total-${row.id}`);

                          const isProdEditable = !row.isMandatory;
                          const isIndEditable = !row.isMandatory && (row.productoSelect === "Otro (Personalizado)" || row.productoSelect === "");
                          const isTipoEditable = !row.isMandatory && (row.productoSelect === "Otro (Personalizado)" || row.productoSelect === "");

                          return (
                            <tr key={row.id} className={cn("border-b border-slate-200 hover:bg-slate-100 transition-colors", groupBg)}>
                              {/* Col 0: N° */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-0`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 0, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 0, false, row.id, absoluteIndex)}
                                onDoubleClick={triggerWarning}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 0, false, false, cn(
                                  "p-2 border-r border-slate-200 align-middle transition-colors",
                                  rowActive ? "text-emerald-900 bg-emerald-100/50" : "text-slate-500"
                                ))}
                              >
                                <div className="relative group flex items-center justify-center gap-1.5">
                                  <span className="font-bold">{rpIndex + 1}.{relativeIndex + 1}</span>
                                  <button
                                    tabIndex={-1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalEditRowId(row.id);
                                    }}
                                    className="text-primary hover:text-white hover:bg-primary p-1 rounded transition-colors"
                                    title="Abrir editor de metas mensual en grande"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Custom CSS Hover Tooltip */}
                                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-805 text-slate-800 text-sm font-bold py-1 px-2 rounded shadow-md border border-slate-200 bg-white whitespace-nowrap z-50 pointer-events-none transition-all">
                                    Editor vertical accesible (mes a mes)
                                  </span>
                                </div>
                              </td>

                              {/* Col 1: Resultado Intermedio */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-1`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 1, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 1, isProdEditable, row.id, absoluteIndex)}
                                onDoubleClick={() => {
                                  if (isProdEditable) {
                                    setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 1, isEditing: true });
                                    setTimeout(() => {
                                      const inputId = `input-matriz-${rp.id}-${relativeIndex}-1`;
                                      document.getElementById(inputId)?.focus();
                                    }, 0);
                                  } else {
                                    triggerWarning();
                                  }
                                }}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 1, isProdEditable, isProdModified, "p-2 border-r border-slate-200 align-middle")}
                              >
                                {row.isMandatory ? (
                                  <div className="w-full min-h-[50px] p-2 border border-slate-200 rounded text-sm bg-slate-100 text-slate-600 select-none">
                                    {row.producto}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <select
                                      id={`input-matriz-${rp.id}-${relativeIndex}-1`}
                                      tabIndex={-1}
                                      className="w-full p-1.5 border border-slate-300 rounded bg-slate-50 outline-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                      value={row.productoSelect}
                                      onChange={(e) => handleUpdateRow(absoluteIndex, "productoSelect", e.target.value)}
                                      onFocus={(e) => {
                                        e.stopPropagation();
                                        setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 1, isEditing: true });
                                      }}
                                      onKeyDown={(e) => handleInputKeyDown(e, "matriz", rp.id, relativeIndex, 1)}
                                    >
                                      <option value="">Seleccione o cree...</option>
                                      {resultadosEstandarizados.map(res => (
                                        <option key={res.nombre} value={res.nombre}>{res.nombre}</option>
                                      ))}
                                    </select>
                                    {row.productoSelect === "Otro (Personalizado)" && (
                                      <textarea
                                        id={`input-matriz-${rp.id}-${relativeIndex}-1-text`}
                                        tabIndex={-1}
                                        className="w-full min-h-[50px] p-2 border border-slate-300 rounded outline-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none mt-2"
                                        placeholder="Describa el resultado..."
                                        value={row.producto}
                                        onChange={(e) => handleUpdateRow(absoluteIndex, "producto", e.target.value)}
                                        onFocus={(e) => {
                                          e.stopPropagation();
                                          setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 1, isEditing: true });
                                        }}
                                        onKeyDown={(e) => handleInputKeyDown(e, "matriz", rp.id, relativeIndex, 1)}
                                      />
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Col 2: Indicador */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-2`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 2, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 2, isIndEditable, row.id, absoluteIndex)}
                                onDoubleClick={() => {
                                  if (isIndEditable) {
                                    setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 2, isEditing: true });
                                    setTimeout(() => {
                                      const inputId = `input-matriz-${rp.id}-${relativeIndex}-2`;
                                      document.getElementById(inputId)?.focus();
                                    }, 0);
                                  } else {
                                    triggerWarning();
                                  }
                                }}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 2, isIndEditable, isIndModified, "p-1 border-r border-slate-200 align-middle")}
                              >
                                {row.isMandatory ? (
                                  <div className="w-full h-full min-h-[80px] p-2 rounded bg-slate-100 text-slate-600 text-sm select-none">
                                    {row.indicador}
                                  </div>
                                ) : (
                                  <textarea
                                    id={`input-matriz-${rp.id}-${relativeIndex}-2`}
                                    tabIndex={-1}
                                    className="w-full h-full min-h-[80px] p-2 bg-transparent border-0 resize-none outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-emerald-500 text-sm disabled:text-slate-500 disabled:bg-slate-50 rounded"
                                    placeholder="Ingrese el indicador..."
                                    value={row.indicador}
                                    onChange={(e) => handleUpdateRow(absoluteIndex, "indicador", e.target.value)}
                                    disabled={row.productoSelect !== "Otro (Personalizado)" && row.productoSelect !== ""}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 2, isEditing: true });
                                    }}
                                    onKeyDown={(e) => handleInputKeyDown(e, "matriz", rp.id, relativeIndex, 2)}
                                  />
                                )}
                              </td>

                              {/* Col 3: Tipo de Meta */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-3`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 3, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 3, isTipoEditable, row.id, absoluteIndex)}
                                onDoubleClick={() => {
                                  if (isTipoEditable) {
                                    setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 3, isEditing: true });
                                    setTimeout(() => {
                                      const inputId = `input-matriz-${rp.id}-${relativeIndex}-3`;
                                      document.getElementById(inputId)?.focus();
                                    }, 0);
                                  } else {
                                    triggerWarning();
                                  }
                                }}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 3, isTipoEditable, isTipoModified, "p-2 border-r border-slate-200 text-center align-middle")}
                              >
                                {row.isMandatory ? (
                                  <div className="w-full p-1.5 rounded text-sm bg-slate-100 text-slate-600 font-medium border border-transparent select-none">
                                    {row.tipo}
                                  </div>
                                ) : (
                                  <select
                                    id={`input-matriz-${rp.id}-${relativeIndex}-3`}
                                    tabIndex={-1}
                                    className="w-full p-1.5 border border-slate-300 rounded bg-white outline-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                                    value={row.tipo}
                                    onChange={(e) => handleUpdateRow(absoluteIndex, "tipo", e.target.value)}
                                    disabled={row.productoSelect !== "Otro (Personalizado)" && row.productoSelect !== ""}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: 3, isEditing: true });
                                    }}
                                    onKeyDown={(e) => handleInputKeyDown(e, "matriz", rp.id, relativeIndex, 3)}
                                  >
                                    <option value="Absoluto">Absoluto</option>
                                    <option value="Porcentual">Porcentual (%)</option>
                                  </select>
                                )}
                              </td>

                              {/* Cols 4-15: Months */}
                              {row.meses.map((val, mIndex) => {
                                const colIdx = 4 + mIndex;
                                const isEditingThis = isCellActive("matriz", rp.id, relativeIndex, colIdx) && activeCell?.isEditing;
                                const isMonthModified = modifiedCells.has(`month-${row.id}-${mIndex}`);

                                return (
                                  <td
                                    key={mIndex}
                                    id={`cell-matriz-${rp.id}-${relativeIndex}-${colIdx}`}
                                    tabIndex={0}
                                    onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, colIdx, false)}
                                    onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, colIdx, true, row.id, absoluteIndex)}
                                    onDoubleClick={() => {
                                      setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: colIdx, isEditing: true });
                                      setTimeout(() => {
                                        const inputId = `input-matriz-${rp.id}-${relativeIndex}-${colIdx}`;
                                        const input = document.getElementById(inputId) as HTMLInputElement | null;
                                        if (input) {
                                          input.focus();
                                          input.select();
                                        }
                                      }, 0);
                                    }}
                                    className={getCellClassName("matriz", rp.id, relativeIndex, colIdx, true, isMonthModified, "p-0 border-r border-slate-200 align-middle")}
                                  >
                                    <input
                                      id={`input-matriz-${rp.id}-${relativeIndex}-${colIdx}`}
                                      tabIndex={-1}
                                      type="number"
                                      className={cn(
                                        "w-full h-full min-h-[40px] p-1 text-center bg-transparent outline-none focus:bg-white border-0 focus:ring-0 focus:border-0 rounded",
                                        isMonthModified && !isEditingThis ? "text-amber-900 font-bold" : "",
                                        !isEditingThis && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                      value={val}
                                      placeholder="0"
                                      onChange={(e) => handleUpdateMonth(absoluteIndex, mIndex, e.target.value)}
                                      onFocus={(e) => {
                                        e.stopPropagation();
                                        setActiveCell({ tableType: "matriz", rpId: rp.id, rowIndex: relativeIndex, colIndex: colIdx, isEditing: true });
                                      }}
                                      onKeyDown={(e) => handleInputKeyDown(e, "matriz", rp.id, relativeIndex, colIdx)}
                                    />
                                  </td>
                                );
                              })}

                              {/* Col 16: Total */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-16`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 16, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 16, false, row.id, absoluteIndex)}
                                onDoubleClick={triggerWarning}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 16, false, isRowModified, cn(
                                  "p-2 border-r border-slate-200 text-center font-bold select-none transition-colors",
                                  isRowModified ? "bg-amber-100/90 text-amber-900 border-amber-300" :
                                    row.tipo === "Porcentual" && calculateTotal(row.meses) === 100 ? "bg-emerald-100 text-emerald-800" :
                                      row.tipo === "Porcentual" && calculateTotal(row.meses) > 100 ? "bg-red-100 text-red-800" :
                                        "bg-slate-100/50 text-slate-800"
                                ))}
                              >
                                {calculateTotal(row.meses).toLocaleString()}{row.tipo === "Porcentual" ? "%" : ""}
                              </td>

                              {/* Col 17: Acción */}
                              <td
                                id={`cell-matriz-${rp.id}-${relativeIndex}-17`}
                                tabIndex={0}
                                onFocus={() => handleCellFocus("matriz", rp.id, relativeIndex, 17, false)}
                                onKeyDown={(e) => handleCellKeyDown(e, "matriz", rp.id, relativeIndex, 17, false, row.id, absoluteIndex)}
                                onDoubleClick={triggerWarning}
                                className={getCellClassName("matriz", rp.id, relativeIndex, 17, false, false, "p-1 text-center align-middle")}
                              >
                                {!row.isMandatory && (
                                  <button
                                    tabIndex={-1}
                                    onClick={() => removeRowGroup(absoluteIndex)}
                                    className="text-secondary hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors focus:outline-none"
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

      <Step3PresupuestoGlobal
        resultadosPrincipales={resultadosPrincipales}
        rows={rows}
        updateRow={updateRow}
        activeCell={activeCell}
        handleCellFocus={handleCellFocus}
        handleCellKeyDown={handleCellKeyDown}
        handleInputKeyDown={handleInputKeyDown}
        isCellActive={isCellActive}
        isRowActive={isRowActive}
        isColActive={isColActive}
        getCellClassName={getCellClassName}
        setActiveCell={setActiveCell}
        zoomLevel={zoomLevel}
        modifiedCells={modifiedCells}
        triggerWarning={triggerWarning}
      />

      {/* Vertical Accessibility Month Modal Editor */}
      {modalEditRowId && modalRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">
                  🔍 Editor Accesible de Metas - Fila {modalRowNum}
                </h3>
                <p className="text-slate-200 text-sm mt-0.5">
                  Ingrese los valores mensuales de forma cómoda. Los cambios se guardan automáticamente.
                </p>
              </div>
              <button
                onClick={() => setModalEditRowId(null)}
                className="text-white hover:bg-white/10 rounded-full p-1.5 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Row Details */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 space-y-1">
              <p className="text-sm font-bold text-primary uppercase tracking-wide">Resultado Intermedio</p>
              <p className="text-sm font-semibold text-slate-800">{modalRow.producto || modalRow.productoSelect || "Sin definir"}</p>
              <p className="text-sm text-slate-500 font-medium">Tipo: {modalRow.tipo} | Indicador: {modalRow.indicador || "N/A"}</p>
            </div>

            {/* Scrollable inputs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {months.map((m, mIndex) => (
                  <div key={m} className="flex flex-col gap-1 border border-slate-200 rounded-lg p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <label className="text-sm font-bold text-slate-700 flex justify-between">
                      <span>{mIndex + 1}. {m} (Mes)</span>
                      <span className="text-sm text-slate-400 font-normal">{modalRow.tipo === "Porcentual" ? "%" : "meta"}</span>
                    </label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-300 rounded-md text-lg font-bold text-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                      value={modalRow.meses[mIndex]}
                      placeholder="0"
                      onChange={(e) => handleUpdateMonth(modalAbsoluteIndex, mIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Programado:</span>
                <p className="text-lg font-extrabold text-primary">
                  {calculateTotal(modalRow.meses).toLocaleString()}{modalRow.tipo === "Porcentual" ? "%" : ""}
                </p>
              </div>
              <button
                onClick={() => setModalEditRowId(null)}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
              >
                Listo (Cerrar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Red Warning Toast Notification */}
      {warningMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-650 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-sm z-50 flex items-center gap-2 animate-bounce border border-red-500">
          <span>⚠️</span>
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}
