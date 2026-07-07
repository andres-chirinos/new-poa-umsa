export interface ResultadoPrincipal {
  id: string;
  acp: string;
  resultado: string;
  indicador: string;
  objetivoGestion: string;
}

export interface RowData {
  id: string;
  resultadoPrincipalId: string;
  productoSelect: string;
  producto: string;
  indicador: string;
  tipo: "Absoluto" | "Porcentual";
  meses: string[]; // 12 months
  presupuesto?: string;
  isMandatory?: boolean;
}

export interface DetalleFinanciero {
  id: string;
  resultadoId: string; // Links to RowData.id (the '-M' one)
  tipo: "Ingreso" | "Egreso";
  partida: string; // Rubro / Partida
  detalle: string;
  mes: string;
  precioUnitario: string;
  cantidad: string;
}

export interface FormDataPOA {
  pdes: string;
  pdu: string;
  pei: string;
}
