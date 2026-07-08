"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Save, Download, ExternalLink, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RowData, DetalleFinanciero, FormDataPOA, ResultadoPrincipal } from "@/types/poa";
import { Step1Articulacion } from "./Step1Articulacion";
import { Step2Programacion } from "./Step2Programacion";
import { Step3Matriz, resultadosEstandarizados } from "./Step3Matriz";
import { Step4DetalleFinanciero } from "./Step4DetalleFinanciero";
import { exportToExcel } from "@/lib/excelExport";

const pasos = [
  { id: 1, title: "Articulación PEI-POA", desc: "Alineación Estratégica" },
  { id: 2, title: "Programación Corto Plazo", desc: "Resultados Principales" },
  { id: 3, title: "Resultados Intermedios", desc: "Matriz Mensual" },
  { id: 4, title: "Detalle Financiero", desc: "Costos e Ingresos" },
];

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  
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
    { id: "1-M", resultadoPrincipalId: "rp-censo", isMandatory: true, productoSelect: "Otro (Personalizado)", producto: "Nº de informes de resultados del Censo Universitario presentados", indicador: "Informe con documento de respaldo", tipo: "Absoluto", meses: ["0", "0", "1", "0", "0", "1", "0", "0", "1", "0", "0", "0"], presupuesto: "0" },
    { id: "2-M", resultadoPrincipalId: "rp-censo", isMandatory: true, productoSelect: "Otro (Personalizado)", producto: "Nº de Documentos Elaborados para la Publicación de resultados para ser enviado a las Autoridades", indicador: "Informe con documento de respaldo", tipo: "Absoluto", meses: ["0", "0", "0", "0", "0", "0", "0", "0", "1", "0", "0", "0"], presupuesto: "0" },
    { id: "3-M", resultadoPrincipalId: "rp-censo", isMandatory: true, productoSelect: "Otro (Personalizado)", producto: "Nº de Informes final de Censo Universitario", indicador: "Informe del responsable", tipo: "Absoluto", meses: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1"], presupuesto: "0" },
  ]);

  const [detalles, setDetalles] = useState<DetalleFinanciero[]>([
    { id: "d1", resultadoId: "1-M", tipo: "Egreso", partida: "", detalle: "", mes: "Ene", precioUnitario: "", cantidad: "" },
    { id: "d2", resultadoId: "2-M", tipo: "Egreso", partida: "", detalle: "", mes: "Ene", precioUnitario: "", cantidad: "" },
    { id: "d3", resultadoId: "3-M", tipo: "Egreso", partida: "", detalle: "", mes: "Ene", precioUnitario: "", cantidad: "" }
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
  const addRowGroup = (resultadoPrincipalId: string, prefilledData?: Partial<RowData>) => {
    const newId = Date.now().toString();
    setRows([
      ...rows,
      { 
        id: newId + "-M", 
        resultadoPrincipalId, 
        productoSelect: prefilledData?.productoSelect || "", 
        producto: prefilledData?.producto || "", 
        indicador: prefilledData?.indicador || "", 
        tipo: prefilledData?.tipo || "Absoluto", 
        meses: Array(12).fill(""), 
        presupuesto: "" 
      }
    ]);
    setDetalles(prev => [
      ...prev,
      { id: "d-" + newId, resultadoId: newId + "-M", tipo: "Egreso", partida: "", detalle: "", mes: "Ene", precioUnitario: "", cantidad: "" }
    ]);
  };

  const removeRowGroup = (absoluteIndex: number) => {
    const baseId = rows[absoluteIndex].id;
    const newRows = [...rows];
    newRows.splice(absoluteIndex, 1);
    setRows(newRows);

    setDetalles(prev => prev.filter(g => g.resultadoId !== baseId));
  };

  const updateRow = (absoluteIndex: number, field: keyof RowData, value: string) => {
    const newRows = [...rows];
    
    if (field === "productoSelect") {
      newRows[absoluteIndex].productoSelect = value;
      const match = resultadosEstandarizados.find(r => r.nombre === value);
      if (value !== "Otro (Personalizado)") {
        newRows[absoluteIndex].producto = value;
        if (match) {
          newRows[absoluteIndex].tipo = match.tipo as any;
          newRows[absoluteIndex].indicador = match.indicador;
        }
      } else {
        newRows[absoluteIndex].producto = "";
        newRows[absoluteIndex].indicador = "";
      }
    } else {
      (newRows[absoluteIndex] as any)[field] = value;
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
    
    let numericValue = Number(newValue) || 0;
    if (newRows[rowIndex].tipo === "Porcentual") {
      const sumWithoutCurrent = newMeses.reduce((acc, curr, idx) => acc + (idx === monthIndex ? 0 : Number(curr) || 0), 0);
      if (sumWithoutCurrent + numericValue > 100) {
        numericValue = 100 - sumWithoutCurrent;
        newValue = numericValue.toString();
      }
    }

    newMeses[monthIndex] = newValue;
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
    
    // 1. Unified SIFU+ UMSA Document Header
    autoTable(doc, {
      startY: 12,
      body: [
        [
          { 
            content: "SIFU+\n(MODIFICADO)\n\nUMSA\nDIRECCIÓN ADM. FINANCIERA", 
            rowSpan: 3, 
            styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 9, fillColor: [240, 244, 248], textColor: [0, 51, 102] } 
          },
          { content: "DIRECCIÓN: Rectorado / Administración Central", styles: { fontStyle: 'bold', fontSize: 8 } },
          { content: "FACULTAD DE INGENIERÍA", styles: { fontSize: 8 }, colSpan: 2 }
        ],
        [
          { content: "ACTIVIDAD/PROY: PLANIFICACIÓN Y PRESUPUESTO INSTITUCIONAL", styles: { fontStyle: 'bold', fontSize: 8 } },
          { content: "ING.- CBAS - CURSO BÁSICO", styles: { fontSize: 8 }, colSpan: 2 },
          { content: "30-031-101-00000000000000-033", styles: { halign: 'right', fontSize: 8 } }
        ],
        [
          { content: "SUB ACTIVIDAD: Plan Operativo Anual (POA)", styles: { fontStyle: 'bold', fontSize: 8 } },
          { content: "ING.- CBAS - CURSO BÁSICO", styles: { fontSize: 8 }, colSpan: 2 },
          { content: "Gestión: 2026 - 2027", styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } }
        ]
      ],
      theme: 'grid',
      styles: { cellPadding: 2, lineColor: [100, 100, 100], lineWidth: 0.5 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 85 },
        2: { cellWidth: 70 },
        3: { cellWidth: 69 }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 6;

    // 2. DATOS GENERALES Section
    autoTable(doc, {
      startY: finalY,
      body: [
        [
          { content: "DATOS GENERALES", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 225, 230], textColor: [30, 41, 59], fontSize: 9 } }
        ],
        [
          { content: "Responsable: Gustavo Adolfo Gonzales Gomez", styles: { fontSize: 8 } },
          { content: "Cargo Responsable: Director a.i.", styles: { fontSize: 8 } }
        ]
      ],
      theme: 'grid',
      styles: { cellPadding: 2, lineColor: [100, 100, 100], lineWidth: 0.5 },
      columnStyles: {
        0: { cellWidth: 135 },
        1: { cellWidth: 134 }
      }
    });

    finalY = (doc as any).lastAutoTable.finalY + 8;

    // Step 2, 3, 4 Hierarchical Print
    resultadosPrincipales.forEach((rp, rpIndex) => {
      if (finalY > 150) {
        doc.addPage();
        finalY = 15;
      }

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 51, 102);
      doc.text(`ARTICULACIÓN PEI - POA - RESULTADO PRINCIPAL ${rpIndex + 1}`, 14, finalY);
      finalY += 4;

      const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
      const rpBudgetTotal = rpRows.reduce((acc, curr) => acc + (Number(curr.presupuesto) || 0), 0);

      // Articulación PEI - POA Table (Grid representation of Step 1 & 2 details)
      autoTable(doc, {
        startY: finalY,
        head: [[
          { content: "Código PEI", styles: { halign: 'center' } },
          { content: "Acción Institucional (PEI)", styles: { halign: 'left' } },
          { content: "Indicador Proceso", styles: { halign: 'left' } },
          { content: "Área o Unidad", styles: { halign: 'left' } },
          { content: "Código POA", styles: { halign: 'center' } },
          { content: "Acción a Corto Plazo (ACP)", styles: { halign: 'left' } },
          { content: "Resultado Esperado", styles: { halign: 'left' } },
          { content: "Presupuesto (Bs)", styles: { halign: 'right' } }
        ]],
        body: [
          [
            "5.1.1.2 - 1.1.1",
            formData.pei || 'Acciones de Mejora Continua',
            rp.indicador || 'N/A',
            "ING.- CBAS - CURSO BÁSICO",
            `P30-303.${rpIndex + 1}`,
            rp.acp || 'N/A',
            rp.resultado || 'N/A',
            { content: rpBudgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
          ],
          [
            { content: `Objetivo de Gestión: ${rp.objetivoGestion || 'N/A'}`, colSpan: 8, styles: { fontStyle: 'italic', fillColor: [248, 250, 252], textColor: [71, 85, 105] } }
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 225, 230], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2, lineColor: [100, 100, 100], lineWidth: 0.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 44 },
          6: { cellWidth: 45 },
          7: { cellWidth: 35 }
        }
      });

      finalY = (doc as any).lastAutoTable.finalY + 6;

      if (rpRows.length > 0) {
        const calculateTotal = (meses: string[]) => meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);

        const tableData = rpRows.map((row, index) => {
          return [
            `${rpIndex + 1}.${index + 1}`,
            row.producto,
            row.indicador,
            row.tipo,
            ...row.meses.map(m => m ? m : '0'),
            calculateTotal(row.meses).toString()
          ];
        });

        if (finalY > 150) {
          doc.addPage();
          finalY = 15;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("Resultados Intermedios y Planificación Mensual:", 14, finalY);

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
                  data.cell.styles.textColor = [0, 51, 102];
              }
          },
          didDrawPage: (data) => {
            finalY = data.cursor ? data.cursor.y : finalY;
          }
        });

        finalY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Detalle Financiero for this RP
      const uniqueIntermediateRows = rpRows;
      
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
              d.detalle,
              d.mes,
              pUnit.toFixed(2),
              cant.toString(),
              total.toFixed(2)
            ];
          });

          const resTotalIngresos = riDetalles.filter(d => d.tipo === "Ingreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
          const resTotalEgresos = riDetalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
          
          if (resTotalIngresos > 0) detallesTableData.push(["", "", "", "", "", "TOT. INGRESO", resTotalIngresos.toFixed(2)]);
          if (resTotalEgresos > 0) detallesTableData.push(["", "", "", "", "", "TOT. EGRESO", resTotalEgresos.toFixed(2)]);

          autoTable(doc, {
            startY: finalY + 4,
            head: [['N°', 'Tipo', 'Partida / Detalle', 'Mes', 'P. Unitario (Bs)', 'Cantidad', 'Monto Total (Bs)']],
            body: detallesTableData,
            theme: 'grid',
            headStyles: { fillColor: [50, 50, 50], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 18, fontStyle: 'bold' },
              4: { halign: 'right' },
              5: { halign: 'right' },
              6: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body') {
                const rawRow = data.row.raw as any[];
                const isTotalRow = rawRow[5] === "TOT. INGRESO" || rawRow[5] === "TOT. EGRESO";
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

    // Print Asignación Presupuestaria Global
    if (rows.length > 0) {
      if (finalY > 150) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(34, 139, 34); // Emerald
      doc.text("Asignación Presupuestaria Global", 14, finalY);

      const presupuestoTableData = rows.map((row, index) => {
        const rpIndex = resultadosPrincipales.findIndex(rp => rp.id === row.resultadoPrincipalId);
        const rpRows = rows.filter(r => r.resultadoPrincipalId === row.resultadoPrincipalId);
        const relativeIndex = rpRows.findIndex(r => r.id === row.id);
        const rpName = resultadosPrincipales[rpIndex]?.resultado || `Resultado Principal ${rpIndex + 1}`;
        
        return [
          `${rpIndex + 1}.${relativeIndex + 1}`,
          rpName,
          row.producto || `Resultado Intermedio (Sin definir)`,
          Number(row.presupuesto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
      });

      const totalPresupuesto = rows.reduce((acc, r) => acc + (Number(r.presupuesto) || 0), 0);
      const techoCarrera = 1200000;
      const restante = techoCarrera - totalPresupuesto;

      presupuestoTableData.push(["", "", "TOTAL ASIGNADO:", totalPresupuesto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);
      presupuestoTableData.push(["", "", "PRESUPUESTO RESTANTE:", restante.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['N°', 'Resultado Principal', 'Resultado Intermedio', 'Presupuesto (Bs)']],
        body: presupuestoTableData,
        theme: 'grid',
        headStyles: { fillColor: [6, 78, 59], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 60 },
          3: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function(data) {
          if (data.section === 'body') {
            const rawRow = data.row.raw as any[];
            if (rawRow[2] === "TOTAL ASIGNADO:" || rawRow[2] === "PRESUPUESTO RESTANTE:") {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
              if (rawRow[2] === "PRESUPUESTO RESTANTE:" && restante < 0) {
                data.cell.styles.textColor = [204, 0, 0];
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

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    setPdfBlobUrl(blobUrl);
    setShowPdfModal(true);
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = 'Formulario_POA_UMSA.pdf';
    link.click();
  };

  const handleExportExcel = () => {
    exportToExcel(resultadosPrincipales, rows, detalles, formData);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
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
                <p className={cn("font-bold text-sm", isActive ? "text-primary" : "text-slate-500")}>
                  {step.title}
                </p>
                <p className="text-sm text-slate-400 hidden lg:block">{step.desc}</p>
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
            handleExportExcel={handleExportExcel}
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
            handleExportExcel={handleExportExcel}
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

      {/* PDF Preview Modal */}
      {showPdfModal && pdfBlobUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Unified Header & Action Toolbar */}
            <div className="bg-primary text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 shrink-0">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white/90 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg leading-tight font-serif">
                    Vista Previa del POA (PDF)
                  </h3>
                  <p className="text-slate-200 text-xs mt-0.5">
                    Revise el documento generado antes de guardarlo o imprimirlo.
                  </p>
                </div>
              </div>
              
              {/* Action Toolbar on the Right */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={handleDownloadPdf}
                  className="bg-white text-primary hover:bg-white/90 font-bold px-4 py-2.5 rounded-lg text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Descargar PDF
                </button>
                <button
                  onClick={() => window.open(pdfBlobUrl, "_blank")}
                  className="bg-primary hover:bg-white/10 border border-white/30 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" /> Ver en Pestaña Nueva
                </button>
                <button 
                  onClick={handleClosePdfModal}
                  className="text-white hover:bg-white/10 rounded-full p-2 transition-colors font-bold cursor-pointer ml-2 border border-transparent hover:border-white/20"
                  title="Cerrar Vista Previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer Body */}
            <div className="flex-1 p-4 bg-slate-100 overflow-hidden">
              <iframe 
                src={pdfBlobUrl} 
                className="w-full h-full border border-slate-300 rounded-lg bg-white shadow-inner"
                title="Vista Previa de PDF POA UMSA"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
