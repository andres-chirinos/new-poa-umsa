import { ResultadoPrincipal, RowData, DetalleFinanciero, FormDataPOA } from "@/types/poa";

export function exportToExcel(
  resultadosPrincipales: ResultadoPrincipal[],
  rows: RowData[],
  detalles: DetalleFinanciero[],
  formData: FormDataPOA
) {
  // 1. Building the HTML template for Excel representation
  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Planificacion POA UMSA</x:Name>
<x:WorksheetOptions>
<x:DisplayGridlines/>
</x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; width: 100%; margin-bottom: 25px; }
  th { border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; background-color: #0f172a; color: white; text-align: center; font-size: 10pt; }
  td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10pt; color: #334155; vertical-align: middle; }
  .title-cell { font-size: 16pt; font-weight: bold; background-color: #1e3a8a; color: white; text-align: center; height: 50px; }
  .subtitle-cell { font-size: 10pt; font-weight: bold; background-color: #f1f5f9; color: #1e293b; height: 25px; }
  .section-title { font-size: 13pt; font-weight: bold; background-color: #3b82f6; color: white; padding: 10px; }
  .header-rp { font-size: 11pt; font-weight: bold; background-color: #003366; color: white; padding: 8px; }
  .total-row { font-weight: bold; background-color: #f8fafc; color: #0f172a; border-top: 2px solid #cbd5e1; }
  .number-cell { text-align: right; font-family: monospace; }
  .text-center { text-align: center; }
  .bold { font-weight: bold; }
  .bg-emerald-header { background-color: #065f46; color: white; }
  .bg-emerald-light { background-color: #ecfdf5; font-weight: bold; }
  .bg-amber-light { background-color: #fef3c7; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="18" class="title-cell">SIFU+ (PLAN OPERATIVO ANUAL - UMSA)</td>
    </tr>
    <tr>
      <td colspan="4" class="subtitle-cell">DIRECCIÓN ADM. FINANCIERA:</td>
      <td colspan="14">Administración Central / Rectorado</td>
    </tr>
    <tr>
      <td colspan="4" class="subtitle-cell">FACULTAD / UNIDAD:</td>
      <td colspan="14">FACULTAD DE INGENIERÍA - CURSO BÁSICO</td>
    </tr>
    <tr>
      <td colspan="4" class="subtitle-cell">PLAN ESTRATÉGICO INSTITUCIONAL (PEI):</td>
      <td colspan="14">${formData.pei || '192 - Acciones de Mejora Continua'}</td>
    </tr>
    <tr>
      <td colspan="4" class="subtitle-cell">GESTIÓN:</td>
      <td colspan="14">2026 - 2027</td>
    </tr>
  </table>

  <!-- SECCIÓN 1: MATRIZ DE PLANIFICACIÓN -->
  <table>
    <tr>
      <td colspan="18" class="section-title">I. MATRIZ DE PLANIFICACIÓN FÍSICA E INDICADORES</td>
    </tr>
  </table>
`;

  resultadosPrincipales.forEach((rp, rpIdx) => {
    const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
    
    html += `
  <table>
    <tr>
      <td colspan="18" class="header-rp">Resultado Principal ${rpIdx + 1}: ${rp.resultado || 'Sin definir'}</td>
    </tr>
    <tr>
      <th style="width: 50px;">N°</th>
      <th style="width: 250px;">Resultado Intermedio</th>
      <th style="width: 250px;">Indicador</th>
      <th style="width: 100px;">Tipo de Meta</th>
      <th style="width: 50px;">Ene</th>
      <th style="width: 50px;">Feb</th>
      <th style="width: 50px;">Mar</th>
      <th style="width: 50px;">Abr</th>
      <th style="width: 50px;">May</th>
      <th style="width: 50px;">Jun</th>
      <th style="width: 50px;">Jul</th>
      <th style="width: 50px;">Ago</th>
      <th style="width: 50px;">Sep</th>
      <th style="width: 50px;">Oct</th>
      <th style="width: 50px;">Nov</th>
      <th style="width: 50px;">Dic</th>
      <th style="width: 80px;">Total</th>
      <th style="width: 100px;">Presupuesto (Bs)</th>
    </tr>
`;

    if (rpRows.length === 0) {
      html += `
    <tr>
      <td colspan="18" class="text-center" style="font-style: italic; color: #94a3b8;">No hay resultados intermedios programados.</td>
    </tr>
`;
    } else {
      const calculateTotal = (meses: string[]) => meses.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
      rpRows.forEach((row, rIdx) => {
        const totalVal = calculateTotal(row.meses);
        const isPorcentual = row.tipo === "Porcentual";
        const presupuestoVal = Number(row.presupuesto) || 0;
        
        html += `
    <tr>
      <td class="text-center bold">${rpIdx + 1}.${rIdx + 1}</td>
      <td>${row.producto || row.productoSelect || 'Sin definir'}</td>
      <td>${row.indicador || 'Sin definir'}</td>
      <td class="text-center">${row.tipo}</td>
      ${row.meses.map(m => `<td class="text-center">${m || 0}</td>`).join("")}
      <td class="text-center bold">${totalVal.toLocaleString()}${isPorcentual ? "%" : ""}</td>
      <td class="number-cell bold">${presupuestoVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
`;
      });
      
      // Sum total presupuesto for this RP
      const rpTotalPresupuesto = rpRows.reduce((acc, curr) => acc + (Number(curr.presupuesto) || 0), 0);
      html += `
    <tr class="total-row">
      <td colspan="17" class="number-cell bold">SUBTOTAL PRESUPUESTO RESULTADO PRINCIPAL ${rpIdx + 1}:</td>
      <td class="number-cell bold">${rpTotalPresupuesto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
`;
    }
    
    html += `</table>`;
  });

  // SECCIÓN 2: DETALLE FINANCIERO DE EGRESOS
  const totalPresupuestoGeneral = rows.reduce((acc, curr) => acc + (Number(curr.presupuesto) || 0), 0);
  const totalEgresosGeneral = detalles.filter(d => d.tipo === "Egreso").reduce((acc, d) => acc + ((Number(d.precioUnitario) || 0) * (Number(d.cantidad) || 0)), 0);
  const saldoRestante = 1200000 - totalPresupuestoGeneral;

  html += `
  <!-- SECCIÓN 2: DETALLE FINANCIERO -->
  <table>
    <tr>
      <td colspan="8" class="section-title">II. DETALLE FINANCIERO Y CONTROL DE EGRESOS</td>
    </tr>
  </table>

  <table>
    <tr class="bg-emerald-header">
      <th style="width: 50px;">Fila</th>
      <th style="width: 120px;">Resultado Intermedio</th>
      <th style="width: 80px;">Tipo Trans.</th>
      <th style="width: 250px;">Partida / Detalle</th>
      <th style="width: 60px;">Mes</th>
      <th style="width: 100px;">P. Unitario (Bs)</th>
      <th style="width: 70px;">Cantidad</th>
      <th style="width: 120px;">Monto Total (Bs)</th>
    </tr>
`;

  if (detalles.length === 0) {
    html += `
    <tr>
      <td colspan="8" class="text-center" style="font-style: italic; color: #94a3b8;">No hay registros de costos financieros detallados.</td>
    </tr>
`;
  } else {
    detalles.forEach((det, dIdx) => {
      const rpIndex = resultadosPrincipales.findIndex(rp => {
        const rpRows = rows.filter(r => r.resultadoPrincipalId === rp.id);
        return rpRows.some(r => r.id === det.resultadoId);
      });
      const rowObj = rows.find(r => r.id === det.resultadoId);
      const rpRows = rowObj ? rows.filter(r => r.resultadoPrincipalId === rowObj.resultadoPrincipalId) : [];
      const relativeIndex = rowObj ? rpRows.findIndex(r => r.id === rowObj.id) : -1;
      const resNum = rpIndex !== -1 && relativeIndex !== -1 ? `${rpIndex + 1}.${relativeIndex + 1}` : "";
      
      const precio = Number(det.precioUnitario) || 0;
      const cant = Number(det.cantidad) || 0;
      const subtotal = precio * cant;

      html += `
    <tr>
      <td class="text-center bold">${dIdx + 1}</td>
      <td class="text-center bold">Fila ${resNum}</td>
      <td class="text-center bold" style="color: #b91c1c;">Gasto</td>
      <td>${det.detalle || 'Sin definir'}</td>
      <td class="text-center">${det.mes}</td>
      <td class="number-cell">${precio.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-center">${cant}</td>
      <td class="number-cell bold" style="background-color: #fef2f2;">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
`;
    });

    html += `
    <tr class="total-row">
      <td colspan="7" class="number-cell bold" style="height: 30px;">GRAN TOTAL EGRESOS DETALLADOS:</td>
      <td class="number-cell bold" style="background-color: #fee2e2; color: #991b1b; font-size: 11pt;">${totalEgresosGeneral.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr class="total-row">
      <td colspan="7" class="number-cell bold" style="height: 30px;">TOTAL PRESUPUESTO ASIGNADO (DE CARRERA):</td>
      <td class="number-cell bold" style="background-color: #d1fae5; color: #065f46; font-size: 11pt;">${totalPresupuestoGeneral.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr class="total-row">
      <td colspan="7" class="number-cell bold" style="height: 30px;">SALDO RESTANTE TECHO PRESUPUESTARIO (Bs 1,200,000.00):</td>
      <td class="number-cell bold" style="${saldoRestante < 0 ? 'background-color: #fee2e2; color: #991b1b;' : 'background-color: #ecfdf5; color: #047857;'} font-size: 11pt;">
        ${saldoRestante.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
`;
  }

  html += `
  </table>
</body>
</html>
`;

  // 2. Creating blob and downloading
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Formulario_POA_UMSA_Formateado.xls";
  link.click();
  URL.revokeObjectURL(url);
}
