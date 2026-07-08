"use client";

import { useState, useEffect, useRef } from "react";
import { RowData, ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2, FileText, SlidersHorizontal, Building2, GraduationCap, Download, Target, Search, ClipboardList, Edit3, BarChart3, Settings, Hash, Percent, X } from "lucide-react";
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
  addRowGroup: (resultadoPrincipalId: string, prefilledData?: Partial<RowData>) => void;
  removeRowGroup: (index: number) => void;
  updateRow: (index: number, field: keyof RowData, value: string) => void;
  updateMonth: (rowIndex: number, monthIndex: number, value: string) => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
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

export function Step3Matriz({ resultadosPrincipales, rows, addRowGroup, removeRowGroup, updateRow, updateMonth, handleExportPdf, handleExportExcel }: Props) {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [zoomLevel, setZoomLevel] = useState<"normal" | "large" | "xlarge">("normal");

  // Track modified cells to display orange warning flags
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set());

  // Non-editable cell warning alert
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Estados para el Modal Accesible de Agregar Resultado Intermedio
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRpIdForAdd, setActiveRpIdForAdd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOption, setActiveOption] = useState<"plantilla" | "personalizado">("plantilla");
  const [customResult, setCustomResult] = useState<{
    producto: string;
    indicador: string;
    tipo: "Absoluto" | "Porcentual";
  }>({
    producto: "",
    indicador: "",
    tipo: "Absoluto"
  });
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  const prevRowsLengthRef = useRef(rows.length);
  const prevRowsIdsRef = useRef(new Set(rows.map(r => r.id)));

  useEffect(() => {
    if (rows.length > prevRowsLengthRef.current) {
      const newRow = rows.find(r => !prevRowsIdsRef.current.has(r.id));
      if (newRow) {
        // Encontrar su relativeIndex en su respectivo Resultado Principal
        const rpRows = rows.filter(r => r.resultadoPrincipalId === newRow.resultadoPrincipalId);
        const relativeIndex = rpRows.findIndex(r => r.id === newRow.id);
        
        if (relativeIndex !== -1) {
          // Esperamos a que el DOM se renderice para poder enfocar
          setTimeout(() => {
            focusCell("matriz", newRow.resultadoPrincipalId, relativeIndex, 4, true);
          }, 100);
        }
      }
    }
    prevRowsLengthRef.current = rows.length;
    prevRowsIdsRef.current = new Set(rows.map(r => r.id));
  }, [rows]);

  const openAddModal = (rpId: string) => {
    setActiveRpIdForAdd(rpId);
    setSearchQuery("");
    setActiveOption("plantilla");
    setCustomResult({
      producto: "",
      indicador: "",
      tipo: "Absoluto"
    });
    setSelectedTemplateIndex(null);
    setIsAddModalOpen(true);
  };

  const handleCustomChange = (field: string, value: string) => {
    setCustomResult(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmAdd = () => {
    if (!activeRpIdForAdd) return;

    if (activeOption === "plantilla") {
      if (selectedTemplateIndex === null) {
        alert("Por favor seleccione una plantilla rápida de la lista.");
        return;
      }
      const template = resultadosEstandarizados[selectedTemplateIndex];
      addRowGroup(activeRpIdForAdd, {
        productoSelect: template.nombre,
        producto: template.nombre,
        indicador: template.indicador,
        tipo: template.tipo as any
      });
    } else {
      if (!customResult.producto.trim()) {
        alert("Por favor ingrese la descripción del resultado intermedio.");
        return;
      }
      addRowGroup(activeRpIdForAdd, {
        productoSelect: "Otro (Personalizado)",
        producto: customResult.producto,
        indicador: customResult.indicador,
        tipo: customResult.tipo
      });
    }
    setIsAddModalOpen(false);
  };

  // Filtrado de plantillas rápidas excluyendo la opción personalizada
  const filteredTemplates = resultadosEstandarizados
    .map((t, idx) => ({ ...t, originalIndex: idx }))
    .filter(t => t.nombre !== "Otro (Personalizado)")
    .filter(t => t.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const focusCell = (
    tableType: "matriz" | "presupuesto",
    rpId: string | undefined,
    rowIndex: number,
    colIndex: number,
    startEditing: boolean = false
  ) => {
    const id = tableType === "matriz"
      ? `cell-matriz-${rpId}-${rowIndex}-${colIndex}`
      : `cell-presupuesto-${rowIndex}-${colIndex}`;
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }

    setActiveCell({ tableType, rpId, rowIndex, colIndex, isEditing: startEditing });

    if (startEditing) {
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
      }, 50);
    }
    return !!element;
  };

  const navigateGrid = (direction: "up" | "down" | "left" | "right" | "next" | "prev", startEditing: boolean = false) => {
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
    focusCell(targetTable.type, targetTable.rpId, nextRowIndex, nextColIndex, startEditing);
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

      // Excel behavior: move right to the next month and start editing
      setTimeout(() => {
        navigateGrid("next", true);
      }, 50);
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
          navigateGrid("prev", true);
        } else {
          navigateGrid("next", true);
        }
      }, 50);
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

  // Dynamic widths selection based on zoom scale
  const widthClass = colWidths[zoomLevel];

  return (
    <div className="w-full space-y-6 relative">
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-primary" />
              3. Matriz de Ejecución e Ingresos/Egresos
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Defina los resultados intermedios asociados. Use flechas para navegar y Enter para editar.
            </p>
          </div>
          
          {/* Action Dock (Zoom + export PDF) */}
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
            {/* Font Zoom controls */}
            <div className="bg-slate-50 p-1.5 rounded-xl flex items-center border border-slate-200 gap-1.5 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-bold text-slate-500 px-2.5 uppercase select-none tracking-wider font-sans">Zoom</span>
              <div className="flex items-center gap-1.5">
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
            </div>
            
            <button
              onClick={handleExportPdf}
              className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 text-secondary" /> Generar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Exportar Excel
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
                      onClick={() => openAddModal(rp.id)}
                      className="flex items-center gap-2 bg-white text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-bold shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Agregar Resultado Intermedio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className={cn("overflow-x-auto transition-all duration-200", zoomClass[zoomLevel])}>
                    <table 
                      className="w-full border-collapse table-fixed"
                      style={{ minWidth: zoomLevel === "normal" ? "1080px" : zoomLevel === "large" ? "1300px" : "1600px" }}
                    >
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
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-bold">{rpIndex + 1}.{relativeIndex + 1}</span>
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
                      onClick={() => openAddModal(rp.id)}
                      className="flex items-center gap-2 bg-white text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-bold shadow-sm cursor-pointer"
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

      {/* Modal Accesible de Agregar Resultado Intermedio */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 accessible-modal-content">
            {/* Cabecera */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-2xl flex items-center gap-2 font-serif">
                  <Target className="w-7 h-7 text-primary" /> Agregar Resultado Intermedio Accesible
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Seleccione una plantilla rápida preconfigurada o redacte un resultado propio con letra grande y clara.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center"
                title="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selector de Opción Excluyente */}
            <div className="px-6 pt-4 pb-1 bg-slate-50 border-b border-slate-200">
              <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200 gap-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOption("plantilla");
                    setSelectedTemplateIndex(null);
                  }}
                  className={cn(
                    "flex-grow flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold transition-all duration-200 cursor-pointer text-center",
                    activeOption === "plantilla"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-550 text-slate-500 hover:bg-white/50"
                  )}
                >
                  <ClipboardList className="w-5 h-5 text-primary" /> Opciones Estandarizadas (Plantilla Rápida)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOption("personalizado");
                    setSelectedTemplateIndex(null);
                    setCustomResult({ producto: "", indicador: "", tipo: "Absoluto" });
                  }}
                  className={cn(
                    "flex-grow flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold transition-all duration-200 cursor-pointer text-center",
                    activeOption === "personalizado"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-550 text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Edit3 className="w-5 h-5 text-primary" /> Crear Resultado Personalizado (Desde Cero)
                </button>
              </div>
            </div>

            {/* Contenido principal con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {activeOption === "plantilla" ? (
                /* BLOQUE A: PLANTILLAS RÁPIDAS */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h4 className="text-lg font-black text-primary uppercase tracking-wider font-serif">
                      Seleccione una Plantilla Rápida
                    </h4>
                    {/* Buscador grande */}
                    <div className="relative w-full sm:w-64">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar plantilla..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-base outline-none focus:border-primary w-full shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => {
                      const isSelected = selectedTemplateIndex === template.originalIndex;
                      return (
                        <div
                          key={template.nombre}
                          onClick={() => {
                            setSelectedTemplateIndex(template.originalIndex);
                          }}
                          className={cn(
                            "border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full hover:shadow-md active:scale-98 select-none",
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 shadow-inner ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div>
                            <p className="text-lg font-black text-slate-800 leading-snug">
                              {template.nombre}
                            </p>
                            <div className="mt-3 space-y-1.5 text-sm text-slate-600 font-medium">
                              <p className="flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4 text-slate-400" />
                                <span>Indicador: <strong>{template.indicador}</strong></span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Settings className="w-4 h-4 text-slate-400" />
                                <span>Tipo de Meta: <strong>{template.tipo}</strong></span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            )}>
                              {isSelected ? "Seleccionado ✓" : "Seleccionar"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTemplates.length === 0 && (
                      <div className="col-span-full p-8 text-center text-slate-400 italic">
                        No se encontraron plantillas coincidentes.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* BLOQUE B: CREACIÓN PERSONALIZADA */
                <div className="space-y-5 bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
                  <h4 className="text-lg font-black text-primary uppercase tracking-wider font-serif">
                    Redacte un Resultado Propio
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Producto Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Descripción del Resultado Intermedio
                      </label>
                      <textarea
                        placeholder="Redacte la descripción del resultado de forma clara..."
                        value={customResult.producto}
                        onChange={(e) => handleCustomChange("producto", e.target.value)}
                        className="p-3.5 border-2 border-slate-200 rounded-xl text-lg font-medium outline-none focus:border-primary bg-white shadow-sm min-h-[100px] resize-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Indicador */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Indicador de Proceso
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Porcentaje de trámites atendidos, Informes aprobados, etc."
                        value={customResult.indicador}
                        onChange={(e) => handleCustomChange("indicador", e.target.value)}
                        className="p-3 border-2 border-slate-200 rounded-xl text-base outline-none focus:border-primary bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Tipo de Meta - Botones de Toggle */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Tipo de Meta
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleCustomChange("tipo", "Absoluto")}
                          className={cn(
                            "flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-bold text-lg transition-all duration-150 cursor-pointer text-center outline-none focus:ring-2 focus:ring-primary/20",
                            customResult.tipo === "Absoluto"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          )}
                        >
                          <Hash className="w-5 h-5 text-primary" /> Meta Absoluta (Unidades)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCustomChange("tipo", "Porcentual")}
                          className={cn(
                            "flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-bold text-lg transition-all duration-150 cursor-pointer text-center outline-none focus:ring-2 focus:ring-primary/20",
                            customResult.tipo === "Porcentual"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          )}
                        >
                          <Percent className="w-5 h-5 text-primary" /> Meta Porcentual (%)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de página */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-3 border border-slate-300 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-8 py-3 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary/95 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Agregar Resultado
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
