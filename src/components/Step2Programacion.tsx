"use client";

import { ResultadoPrincipal } from "@/types/poa";
import { Plus, Trash2 } from "lucide-react";
import React from "react";

interface Props {
  resultadosPrincipales: ResultadoPrincipal[];
  addResultadoPrincipal: () => void;
  removeResultadoPrincipal: (id: string) => void;
  updateResultadoPrincipal: (id: string, field: keyof ResultadoPrincipal, value: string) => void;
}

export function Step2Programacion({ resultadosPrincipales, addResultadoPrincipal, removeResultadoPrincipal, updateResultadoPrincipal }: Props) {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">2. Programación a Corto Plazo</h2>
          <p className="text-slate-500 text-sm">Defina las acciones de corto plazo, los resultados esperados y su objetivo de gestión asociado.</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-300 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-white border-b border-primary">
              <th className="p-2 border-r border-primary/20 font-semibold w-12 text-center">N°</th>
              <th className="p-2 border-r border-primary/20 font-semibold w-64 text-left">Acción de Corto Plazo (ACP)</th>
              <th className="p-2 border-r border-primary/20 font-semibold text-left">Resultado Principal Esperado</th>
              <th className="p-2 border-r border-primary/20 font-semibold w-64 text-left">Indicador Principal</th>
              <th className="p-2 font-semibold w-12 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {resultadosPrincipales.map((res, index) => (
              <React.Fragment key={res.id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500 align-middle" rowSpan={2}>
                    {index + 1}
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none text-xs uppercase"
                      value={res.acp}
                      onChange={(e) => updateResultadoPrincipal(res.id, "acp", e.target.value)}
                    >
                      <option value="">Seleccione ACP...</option>
                      <option value="AE1: FORMACIÓN PROFESIONAL">AE1: FORMACIÓN PROFESIONAL</option>
                      <option value="AE2: INVESTIGACIÓN E INNOVACIÓN">AE2: INVESTIGACIÓN E INNOVACIÓN</option>
                      <option value="AE3: INTERACCIÓN SOCIAL Y EXTENSIÓN">AE3: INTERACCIÓN SOCIAL Y EXTENSIÓN</option>
                      <option value="AE4: GESTIÓN INSTITUCIONAL">AE4: GESTIÓN INSTITUCIONAL</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <textarea 
                      className="w-full min-h-[60px] p-2 border border-slate-300 rounded resize-none focus:ring-1 focus:ring-primary outline-none text-xs"
                      placeholder="Ej: Mantener el 100% de cumplimiento..."
                      value={res.resultado}
                      onChange={(e) => updateResultadoPrincipal(res.id, "resultado", e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <textarea 
                      className="w-full min-h-[60px] p-2 border border-slate-300 rounded resize-none focus:ring-1 focus:ring-primary outline-none text-xs"
                      placeholder="Ej: N° de Operaciones y actividades..."
                      value={res.indicador}
                      onChange={(e) => updateResultadoPrincipal(res.id, "indicador", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center align-middle" rowSpan={2}>
                    <button 
                      onClick={() => removeResultadoPrincipal(res.id)}
                      className="text-secondary hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Eliminar Resultado"
                    >
                      <Trash2 className="w-5 h-5 mx-auto" />
                    </button>
                  </td>
                </tr>
                <tr className="border-b-4 border-slate-300 bg-slate-50/50">
                  <td colSpan={3} className="p-3 border-r border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">OBJETIVO DE GESTIÓN ASOCIADO AL PROYECTO</label>
                    <textarea 
                      className="w-full min-h-[60px] p-2 border border-slate-300 rounded resize-none focus:ring-1 focus:ring-primary outline-none text-xs text-slate-700"
                      placeholder="Describa el objetivo de gestión y propósito de este resultado principal..."
                      value={res.objetivoGestion}
                      onChange={(e) => updateResultadoPrincipal(res.id, "objetivoGestion", e.target.value)}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50 border-t border-slate-300">
          <button 
            onClick={addResultadoPrincipal}
            className="flex items-center gap-2 bg-white text-primary border border-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Resultado Principal
          </button>
        </div>
      </div>
    </div>
  );
}
