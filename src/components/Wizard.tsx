"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RowData, DetalleFinanciero, FormDataPOA, ResultadoPrincipal } from "@/types/poa";
import { Step1Articulacion } from "./Step1Articulacion";
import { Step2Programacion } from "./Step2Programacion";
import { Step3Matriz } from "./Step3Matriz";
import { Step4DetalleFinanciero } from "./Step4DetalleFinanciero";

const pasos = [
  { id: 1, title: "Articulación PEI-POA", desc: "Alineación Estratégica" },
  { id: 2, title: "Programación Corto Plazo", desc: "Resultados Principales" },
  { id: 3, title: "Resultados Intermedios", desc: "Matriz Mensual" },
  { id: 4, title: "Detalle Financiero", desc: "Costos e Ingresos" },
];

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Default values loaded from documentCENSO.pdf
  const [formData, setFormData] = useState<FormDataPOA>({
    pdes: "Eje 7",
    pdu: "1. Formación Profesional",
    pei: "192 - Acciones de Mejora Continua",
  });

  const [resultadosPrincipales, setResultadosPrincipales] = useState<ResultadoPrincipal[]>([
    {
      id: "rp-censo",
      acp: "AE4: GESTIÓN INSTITUCIONAL",
      resultado: "Mantener el 100% de cumplimiento de los Productos en la gestión 2026",
      indicador: "Nº de Operaciones y actividades que contribuyen a los resultados institucionales",
      objetivoGestion: "El proyecto Censo Universitario UMSA 2025 es la recolección, análisis y sistematización de información sociodemográfica, académica, socioeconómica, salud – bienestar, infraestructura y tecnología de la población estudiantil, docente y administrativa de la Universidad Mayor de San Andrés (UMSA); considerando que cada una de áreas serán parte de la encuesta censal. Este proyecto tiene como finalidad proporcionar datos actualizados y precisos que permitan mejorar la planificación estratégica, la gestión académica y administrativa, así como la toma de decisiones a nivel institucional. El censo contribuirá a identificar la percepción, las necesidades y características de la comunidad universitaria, facilitando el diseño de políticas, programas y proyectos orientados al fortalecimiento de la calidad educativa, la equidad y el bienestar del ámbito académico."
    }
  ]);

  const [rows, setRows] = useState<RowData[]>([
    { id: "1-M", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de informes de resultados del Censo Universitario presentados", indicador: "Informe con documento de respaldo", tipo: "Meta", meses: ["0", "0", "1", "0", "0", "1", "0", "0", "1", "0", "0", "0"] },
    { id: "1-I", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de informes de resultados del Censo Universitario presentados", indicador: "Informe con documento de respaldo", tipo: "Ingresos", meses: Array(12).fill("0") },
    { id: "1-E", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de informes de resultados del Censo Universitario presentados", indicador: "Informe con documento de respaldo", tipo: "Egresos", meses: Array(12).fill("0") },

    { id: "2-M", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Documentos Elaborados para la Publicación de resultados para ser enviado a las Autoridades", indicador: "Informe con documento de respaldo", tipo: "Meta", meses: ["0", "0", "0", "0", "0", "0", "0", "0", "1", "0", "0", "0"] },
    { id: "2-I", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Documentos Elaborados para la Publicación de resultados para ser enviado a las Autoridades", indicador: "Informe con documento de respaldo", tipo: "Ingresos", meses: Array(12).fill("0") },
    { id: "2-E", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Documentos Elaborados para la Publicación de resultados para ser enviado a las Autoridades", indicador: "Informe con documento de respaldo", tipo: "Egresos", meses: Array(12).fill("0") },

    { id: "3-M", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Informes final de Censo Universitario", indicador: "Informe del responsable", tipo: "Meta", meses: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1"] },
    { id: "3-I", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Informes final de Censo Universitario", indicador: "Informe del responsable", tipo: "Ingresos", meses: Array(12).fill("0") },
    { id: "3-E", resultadoPrincipalId: "rp-censo", productoSelect: "Otro (Personalizado)", producto: "Nº de Informes final de Censo Universitario", indicador: "Informe del responsable", tipo: "Egresos", meses: Array(12).fill("0") },
  ]);

  const [detalles, setDetalles] = useState<DetalleFinanciero[]>([
    { id: "d1", resultadoId: "1-M", tipo: "Egreso", partida: "21100", detalle: "Material de Escritorio", mes: "Mar", precioUnitario: "150", cantidad: "10" }
  ]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, pasos.length));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  // Step 2 Logic
  const addResultadoPrincipal = () => {
    setResultadosPrincipales([
      ...resultadosPrincipales, 
      { id: Date.now().toString(), acp: "", resultado: "", indicador: "", objetivoGestion: "" }
    ]);
  };

  const removeResultadoPrincipal = (id: string) => {
    setResultadosPrincipales(prev => prev.filter(r => r.id !== id));
    const rowsToDelete = rows.filter(r => r.resultadoPrincipalId === id);
    setRows(prev => prev.filter(r => r.resultadoPrincipalId !== id));
    const rowIdsToDelete = rowsToDelete.map(r => r.id);
    setDetalles(prev => prev.filter(d => !rowIdsToDelete.includes(d.resultadoId)));
  };

  const updateResultadoPrincipal = (id: string, field: keyof ResultadoPrincipal, value: string) => {
    setResultadosPrincipales(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Spreadsheet Logic (Step 3)
  const addRowGroup = (resultadoPrincipalId: string) => {
    const newId = Date.now().toString();
    setRows([
      ...rows,
      { id: newId + "-M", resultadoPrincipalId, productoSelect: "", producto: "", indicador: "", tipo: "Meta", meses: Array(12).fill("") },
      { id: newId + "-I", resultadoPrincipalId, productoSelect: "", producto: "", indicador: "", tipo: "Ingresos", meses: Array(12).fill("") },
      { id: newId + "-E", resultadoPrincipalId, productoSelect: "", producto: "", indicador: "", tipo: "Egresos", meses: Array(12).fill("") }
    ]);
  };

  const removeRowGroup = (absoluteIndex: number) => {
    const baseIndex = Math.floor(absoluteIndex / 3) * 3;
    const baseId = rows[baseIndex].id;
    
    const newRows = [...rows];
    newRows.splice(baseIndex, 3);
    setRows(newRows);

    setDetalles(prev => prev.filter(g => g.resultadoId !== baseId));
  };

  const updateRow = (absoluteIndex: number, field: keyof RowData, value: string) => {
    const newRows = [...rows];
    const baseIndex = Math.floor(absoluteIndex / 3) * 3;
    
    if (field === "productoSelect") {
      newRows[baseIndex].productoSelect = value;
      newRows[baseIndex + 1].productoSelect = value;
      newRows[baseIndex + 2].productoSelect = value;
      if (value !== "Otro (Personalizado)") {
        newRows[baseIndex].producto = value;
        newRows[baseIndex + 1].producto = value;
        newRows[baseIndex + 2].producto = value;
      } else {
        newRows[baseIndex].producto = "";
        newRows[baseIndex + 1].producto = "";
        newRows[baseIndex + 2].producto = "";
      }
    } else if (field === "producto" || field === "indicador") {
      newRows[baseIndex][field] = value;
      newRows[baseIndex + 1][field] = value;
      newRows[baseIndex + 2][field] = value;
    } else {
      newRows[absoluteIndex][field] = value as any;
    }
    setRows(newRows);
  };

  const updateMonth = (rowIndex: number, monthIndex: number, value: string) => {
    const newRows = [...rows];
    const newMeses = [...newRows[rowIndex].meses];
    newMeses[monthIndex] = value;
    newRows[rowIndex].meses = newMeses;
    setRows(newRows);
  };

  // Detalles Logic (Step 4)
  const addDetalle = (resultadoId: string) => {
    setDetalles([...detalles, { id: Date.now().toString(), resultadoId, tipo: "Egreso", partida: "", detalle: "", mes: "Ene", precioUnitario: "", cantidad: "" }]);
  };

  const removeDetalle = (id: string) => {
    setDetalles(prev => prev.filter(g => g.id !== id));
  };

  const updateDetalle = (id: string, field: keyof DetalleFinanciero, value: string) => {
    setDetalles(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  // PDF Generation
  const handleExportPdf = () => {
    const doc = new jsPDF("landscape");
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("UNIVERSIDAD MAYOR DE SAN ANDRÉS", 14, 15);
    doc.setFontSize(12);
    doc.text("Plan Operativo Anual (POA) 2026-2027", 14, 22);

    // Step 1 info
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("1. Articulación PEI-POA", 14, 32);
    doc.setFont("helvetica", "normal");
    doc.text(`PDES: ${formData.pdes || 'N/A'}`, 14, 38);
    doc.text(`PDU: ${formData.pdu || 'N/A'}`, 14, 43);
    doc.text(`PEI: ${formData.pei || 'N/A'}`, 14, 48);

    let finalY = 55;

    // Step 2, 3, 4 Hierarchical Print
    resultadosPrincipales.forEach((rp, rpIndex) => {
      if (finalY > 150) {
        doc.addPage();
        finalY = 20;
      }

      // Title: Resultado Principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(`Resultado Principal ${rpIndex + 1}:`, 14, finalY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      
      const rpLines = doc.splitTextToSize(`${rp.resultado || 'N/A'}`, 260);
      doc.text(rpLines, 14, finalY + 6);
      finalY += 8 + (rpLines.length * 4);

      doc.text(`ACP: ${rp.acp || 'N/A'} | Indicador: ${rp.indicador || 'N/A'}`, 14, finalY);
      finalY += 8;

      if (rp.objetivoGestion) {
        doc.setFont("helvetica", "bold");
        doc.text("Objetivo de Gestión:", 14, finalY);
        doc.setFont("helvetica", "normal");
        const objLines = doc.splitTextToSize(rp.objetivoGestion, 260);
        doc.text(objLines, 14, finalY + 5);
        finalY += 7 + (objLines.length * 4);
      }

      // Filter rows (Intermedios) for this RP
      const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
      if (rpRows.length > 0) {
        const calculateTotal = (meses: string[]) => meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);

        const tableData = rpRows.map((row, index) => {
          const isFirstInGroup = index % 3 === 0;
          const groupNum = Math.floor(index / 3) + 1;
          
          return [
            isFirstInGroup ? `${rpIndex + 1}.${groupNum}` : "",
            isFirstInGroup ? row.producto : "",
            isFirstInGroup ? row.indicador : "",
            row.tipo,
            ...row.meses.map(m => m ? m : '0'),
            calculateTotal(row.meses).toString()
          ];
        });

        doc.setFont("helvetica", "bold");
        doc.text("Resultados Intermedios y Planificación:", 14, finalY);

        autoTable(doc, {
          startY: finalY + 3,
          head: [['N°', 'Resultado Intermedio', 'Indicador', 'Tipo', ...months, 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [0, 51, 102], textColor: 255 }, 
          styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 45 },
            2: { cellWidth: 35 },
            3: { cellWidth: 18, fontStyle: 'bold' }
          },
          didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 3) {
                  if (data.cell.raw === 'Ingresos') {
                      data.cell.styles.textColor = [34, 139, 34];
                  } else if (data.cell.raw === 'Egresos') {
                      data.cell.styles.textColor = [204, 0, 0];
                  } else {
                      data.cell.styles.textColor = [0, 51, 102];
                  }
              }
          },
          didDrawPage: (data) => {
            finalY = data.cursor ? data.cursor.y : finalY;
          }
        });

        finalY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Detalle Financiero for this RP
      const uniqueIntermediateRows = rpRows.filter(r => r.tipo === "Meta");
      
      uniqueIntermediateRows.forEach((ri, riIndex) => {
        const riDetalles = detalles.filter(d => d.resultadoId === ri.id);
        
        if (riDetalles.length > 0) {
          if (finalY > 160) {
            doc.addPage();
            finalY = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 51, 102);
          doc.text(`Detalle Financiero - Res. Intermedio ${rpIndex + 1}.${riIndex + 1}: ${ri.producto || 'N/A'}`, 14, finalY);

          const detallesTableData = riDetalles.map((d, i) => {
            const pUnit = Number(d.precioUnitario) || 0;
            const cant = Number(d.cantidad) || 0;
            const total = pUnit * cant;
            
            return [
              (i + 1).toString(),
              d.tipo,
              d.partida,
              d.detalle,
              d.mes,
              pUnit.toFixed(2),
              cant.toString(),
              total.toFixed(2)
            ];
          });

          const resTotalIngresos = riDetalles.filter(d => d.tipo === "Ingreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
          const resTotalEgresos = riDetalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
          
          if (resTotalIngresos > 0) detallesTableData.push(["", "", "", "", "", "", "TOT. INGRESO", resTotalIngresos.toFixed(2)]);
          if (resTotalEgresos > 0) detallesTableData.push(["", "", "", "", "", "", "TOT. EGRESO", resTotalEgresos.toFixed(2)]);

          autoTable(doc, {
            startY: finalY + 4,
            head: [['N°', 'Tipo', 'Partida/Rubro', 'Detalle', 'Mes', 'P. Unitario (Bs)', 'Cantidad', 'Monto Total (Bs)']],
            body: detallesTableData,
            theme: 'grid',
            headStyles: { fillColor: [50, 50, 50], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 18, fontStyle: 'bold' },
              5: { halign: 'right' },
              6: { halign: 'right' },
              7: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body') {
                const rawRow = data.row.raw as any[];
                const isTotalRow = rawRow[6] === "TOT. INGRESO" || rawRow[6] === "TOT. EGRESO";
                if (isTotalRow) {
                  data.cell.styles.fillColor = [240, 240, 240];
                  data.cell.styles.fontStyle = 'bold';
                }
                if (data.column.index === 1 || data.column.index === 7) {
                  const tipo = rawRow[1];
                  if (tipo === "Ingreso" || rawRow[6] === "TOT. INGRESO") {
                    data.cell.styles.textColor = [34, 139, 34]; // Verde
                  } else if (tipo === "Egreso" || rawRow[6] === "TOT. EGRESO") {
                    data.cell.styles.textColor = [204, 0, 0]; // Rojo
                  }
                }
              }
            },
            didDrawPage: (data) => {
              finalY = data.cursor ? data.cursor.y : finalY;
            }
          });

          finalY = (doc as any).lastAutoTable.finalY + 12;
        }
      });

      finalY += 10;
    });

    // Gran Totals
    const granTotalIngresos = detalles.filter(d => d.tipo === "Ingreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
    const granTotalEgresos = detalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);

    if (granTotalIngresos > 0 || granTotalEgresos > 0) {
      if (finalY > 170) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      doc.setTextColor(34, 139, 34);
      doc.text(`GRAN TOTAL INGRESOS: Bs. ${granTotalIngresos.toFixed(2)}`, 14, finalY);
      
      doc.setTextColor(204, 0, 0);
      doc.text(`GRAN TOTAL EGRESOS: Bs. ${granTotalEgresos.toFixed(2)}`, 14, finalY + 8);
    }

    doc.save('Formulario_POA_UMSA.pdf');
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[75vh]">
      
      {/* Wizard Header / Stepper */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 hidden md:block translate-y-[-50%]"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -z-10 hidden md:block transition-all duration-500 ease-in-out translate-y-[-50%]"
          style={{ width: `${((currentStep - 1) / (pasos.length - 1)) * 100}%` }}
        ></div>

        {pasos.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center mb-4 md:mb-0 bg-slate-50 px-2 group">
              <div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 transition-all duration-300 z-10",
                  isActive ? "bg-primary border-primary/20 text-white shadow-lg" : 
                  isCompleted ? "bg-white border-primary text-primary" : 
                  "bg-white border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : step.id}
              </div>
              <div className="mt-2 text-center">
                <p className={cn("font-bold text-xs", isActive ? "text-primary" : "text-slate-500")}>
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-400 hidden lg:block">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto bg-slate-50/50">
        {currentStep === 1 && <Step1Articulacion formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && (
          <Step2Programacion 
            resultadosPrincipales={resultadosPrincipales} 
            addResultadoPrincipal={addResultadoPrincipal}
            removeResultadoPrincipal={removeResultadoPrincipal}
            updateResultadoPrincipal={updateResultadoPrincipal}
          />
        )}
        {currentStep === 3 && (
          <Step3Matriz 
            resultadosPrincipales={resultadosPrincipales}
            rows={rows} 
            addRowGroup={addRowGroup} 
            removeRowGroup={removeRowGroup} 
            updateRow={updateRow} 
            updateMonth={updateMonth} 
            handleExportPdf={handleExportPdf}
          />
        )}
        {currentStep === 4 && (
          <Step4DetalleFinanciero 
            resultadosPrincipales={resultadosPrincipales}
            rows={rows}
            detalles={detalles}
            addDetalle={addDetalle}
            removeDetalle={removeDetalle}
            updateDetalle={updateDetalle}
            handleExportPdf={handleExportPdf}
          />
        )}
      </div>

      {/* Footer / Navigation Actions */}
      <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all border",
            currentStep === 1 
              ? "opacity-0 pointer-events-none" 
              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="w-5 h-5" /> Atrás
        </button>

        {currentStep < pasos.length ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-md"
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => alert("POA Guardado en el Sistema Exitosamente")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
          >
            Guardar Definitivo <Save className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
