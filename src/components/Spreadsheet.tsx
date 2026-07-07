"use client";

import { useState } from "react";
import { Plus, Trash2, Save, FileSpreadsheet, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";

interface RowData {
  id: string;
  producto: string;
  indicador: string;
  tipo: "Meta" | "Presupuesto";
  meses: string[]; // 12 months
}

export function Spreadsheet() {
  const [headerData, setHeaderData] = useState({
    pdes: "",
    pdu: "",
    pei: "",
    acp: "",
  });

  const [rows, setRows] = useState<RowData[]>([
    {
      id: "1",
      producto: "",
      indicador: "",
      tipo: "Meta",
      meses: Array(12).fill(""),
    },
    {
      id: "2",
      producto: "",
      indicador: "",
      tipo: "Presupuesto",
      meses: Array(12).fill(""),
    }
  ]);

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const addRowGroup = () => {
    const newId = Date.now().toString();
    setRows([
      ...rows,
      { id: newId + "-M", producto: "", indicador: "", tipo: "Meta", meses: Array(12).fill("") },
      { id: newId + "-P", producto: "", indicador: "", tipo: "Presupuesto", meses: Array(12).fill("") }
    ]);
  };

  const removeRowGroup = (index: number) => {
    const baseIndex = Math.floor(index / 2) * 2;
    const newRows = [...rows];
    newRows.splice(baseIndex, 2);
    setRows(newRows);
  };

  const updateRow = (index: number, field: keyof RowData, value: string) => {
    const newRows = [...rows];
    if (field === "producto" || field === "indicador") {
      const baseIndex = Math.floor(index / 2) * 2;
      newRows[baseIndex] = { ...newRows[baseIndex], [field]: value };
      newRows[baseIndex + 1] = { ...newRows[baseIndex + 1], [field]: value };
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    setRows(newRows);
  };

  const updateMonth = (rowIndex: number, monthIndex: number, value: string) => {
    const newRows = [...rows];
    const newMeses = [...newRows[rowIndex].meses];
    const prevValue = newMeses[monthIndex];

    let newValue = value;

    // If previous value was "0" or empty, and a new character is typed, strip the leading "0"
    if ((prevValue === "0" || prevValue === "") && newValue.length > 1 && newValue.startsWith("0") && newValue[1] !== ".") {
      newValue = newValue.substring(1);
    }

    // If value is empty, revert to "0"
    if (newValue === "") {
      newValue = "0";
    }

    newMeses[monthIndex] = newValue;
    newRows[rowIndex] = { ...newRows[rowIndex], meses: newMeses };
    setRows(newRows);
  };

  const calculateTotal = (meses: string[]) => {
    return meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  const handleExportPdf = async () => {
    try {
      // 1. Generate Table PDF using jsPDF
      const doc = new jsPDF("landscape");
      
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102); // Azul UMSA
      doc.text("Plan Operativo Anual", 14, 15);
      
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Resultados Intermedios y Planificación Mensual", 14, 22);
      
      doc.setFontSize(9);
      doc.text(`PDES: ${headerData.pdes || 'N/A'} | PDU: ${headerData.pdu || 'N/A'} | PEI: ${headerData.pei || 'N/A'} | ACP: ${headerData.acp || 'N/A'}`, 14, 30);

      const tableData = rows.map((row, index) => {
        const isFirstInGroup = index % 2 === 0;
        const groupNum = Math.floor(index / 2) + 1;
        
        return [
          isFirstInGroup ? groupNum.toString() : "",
          isFirstInGroup ? row.producto : "",
          isFirstInGroup ? row.indicador : "",
          row.tipo,
          ...row.meses.map(m => m || '0'),
          calculateTotal(row.meses).toString()
        ];
      });

      autoTable(doc, {
        startY: 35,
        head: [['N°', 'Resultado Intermedio', 'Indicador', 'Tipo', ...months, 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: 255 }, // Azul UMSA
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20, fontStyle: 'bold' }
        },
        didParseCell: function(data) {
           if (data.section === 'body' && data.column.index === 3) {
               if (data.cell.raw === 'Presupuesto') {
                   data.cell.styles.textColor = [204, 0, 0]; // Rojo UMSA
               } else {
                   data.cell.styles.textColor = [0, 51, 102];
               }
           }
        }
      });

      const generatedPdfBytes = doc.output('arraybuffer');

      // 2. Fetch the existing documentCENSO.pdf
      // Notice: documentCENSO.pdf needs to be in the public/ directory.
      let existingPdfBytes: ArrayBuffer | null = null;
      try {
        const response = await fetch('/documentCENSO.pdf');
        if (response.ok) {
          existingPdfBytes = await response.arrayBuffer();
        } else {
          console.warn("documentCENSO.pdf no encontrado en /public, se generará solo la tabla.");
        }
      } catch (err) {
        console.warn("No se pudo cargar documentCENSO.pdf", err);
      }

      let finalPdfBytes: Uint8Array;

      if (existingPdfBytes) {
        // 3. Merge them using pdf-lib
        const mergedPdf = await PDFDocument.load(existingPdfBytes);
        const generatedPdf = await PDFDocument.load(generatedPdfBytes);
        
        const copiedPages = await mergedPdf.copyPages(generatedPdf, generatedPdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        finalPdfBytes = await mergedPdf.save();
      } else {
        // Fallback: Just return the generated table if base PDF is missing
        finalPdfBytes = new Uint8Array(generatedPdfBytes);
      }

      // 4. Save and Download
      const blob = new Blob([finalPdfBytes as any], { type: "application/pdf" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'POA_Completo.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Hubo un error al generar el documento PDF combinado.");
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[82vh]">
      
      {/* Excel-like Ribbon Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Matriz POA 2026-2027</h2>
            <p className="text-sm text-slate-500 font-medium">Formato de Planificación y Presupuesto Institucional</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" /> Exportar a PDF
          </button>
          <button 
            onClick={() => alert("Información guardada exitosamente en el sistema.")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm"
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Strategic Framework Header Section */}
      <div className="bg-white p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-1">PDES</label>
          <select 
            className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={headerData.pdes}
            onChange={(e) => handleHeaderChange("pdes", e.target.value)}
          >
            <option value="">Seleccione PDES...</option>
            <option value="7">Eje 7: Educación, Investigación, Ciencia y Tecnología</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-1">PDU</label>
          <select 
            className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={headerData.pdu}
            onChange={(e) => handleHeaderChange("pdu", e.target.value)}
          >
            <option value="">Seleccione PDU...</option>
            <option value="1">1. Formación Profesional</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-1">PEI</label>
          <select 
            className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={headerData.pei}
            onChange={(e) => handleHeaderChange("pei", e.target.value)}
          >
            <option value="">Seleccione PEI...</option>
            <option value="192">192 - Acciones de Mejora</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-1">ACP 2027</label>
          <select 
            className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={headerData.acp}
            onChange={(e) => handleHeaderChange("acp", e.target.value)}
          >
            <option value="">Seleccione ACP...</option>
            <option value="ae1">AE1: FORMACIÓN PROFESIONAL</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="flex-1 overflow-auto bg-slate-100 p-3">
        <div className="min-w-max border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-primary">
                <th className="p-2 border-r border-primary/20 font-semibold w-12 text-center">N°</th>
                <th className="p-2 border-r border-primary/20 font-semibold w-64 text-left">Resultado Intermedio</th>
                <th className="p-2 border-r border-primary/20 font-semibold w-48 text-left">Indicador</th>
                <th className="p-2 border-r border-primary/20 font-semibold w-32 text-center">Tipo</th>
                {months.map(m => (
                  <th key={m} className="p-2 border-r border-primary/20 font-semibold w-20 text-center">{m}</th>
                ))}
                <th className="p-2 border-r border-primary/20 font-semibold w-28 text-center">Total</th>
                <th className="p-2 font-semibold w-12 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isEvenGroup = Math.floor(index / 2) % 2 === 0;
                const groupBg = isEvenGroup ? "bg-white" : "bg-slate-50";
                const isFirstInGroup = index % 2 === 0;

                return (
                  <tr key={row.id} className={cn("border-b border-slate-200 hover:bg-slate-100 transition-colors", groupBg)}>
                    
                    {isFirstInGroup ? (
                      <>
                        <td rowSpan={2} className="p-2 border-r border-slate-200 text-center font-bold text-primary">
                          {Math.floor(index / 2) + 1}
                        </td>
                        <td rowSpan={2} className="p-0 border-r border-slate-200 align-top">
                          <textarea
                            className="w-full h-full min-h-[80px] p-2 bg-transparent resize-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary"
                            placeholder="Ingrese el resultado..."
                            value={row.producto}
                            onChange={(e) => updateRow(index, "producto", e.target.value)}
                          />
                        </td>
                        <td rowSpan={2} className="p-0 border-r border-slate-200 align-top">
                          <textarea
                            className="w-full h-full min-h-[80px] p-2 bg-transparent resize-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary"
                            placeholder="Ingrese el indicador..."
                            value={row.indicador}
                            onChange={(e) => updateRow(index, "indicador", e.target.value)}
                          />
                        </td>
                      </>
                    ) : null}

                    <td className="p-2 border-r border-slate-200 text-center font-medium">
                      <span className={cn(
                        "px-2 py-1 rounded text-sm font-bold",
                        row.tipo === "Meta" ? "bg-blue-100 text-primary" : "bg-red-100 text-secondary"
                      )}>
                        {row.tipo}
                      </span>
                    </td>

                    {row.meses.map((val, mIndex) => (
                      <td key={mIndex} className="p-0 border-r border-slate-200">
                        <input
                          type="number"
                          className="w-full h-full min-h-[40px] p-1 text-center bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary"
                          value={val}
                          placeholder="0"
                          onChange={(e) => updateMonth(index, mIndex, e.target.value)}
                        />
                      </td>
                    ))}

                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 bg-slate-100/50">
                      {row.tipo === "Presupuesto" ? "Bs. " : ""}
                      {calculateTotal(row.meses).toLocaleString()}
                    </td>

                    {isFirstInGroup ? (
                      <td rowSpan={2} className="p-2 text-center align-middle">
                        <button 
                          onClick={() => removeRowGroup(index)}
                          className="text-secondary hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={addRowGroup}
            className="flex items-center gap-2 bg-white text-primary border border-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Resultado Intermedio
          </button>
        </div>
      </div>
    </div>
  );
}
