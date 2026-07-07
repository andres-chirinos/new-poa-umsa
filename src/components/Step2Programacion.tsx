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
                    <div className="w-full p-2 border border-slate-200 rounded bg-slate-100 text-sm uppercase text-slate-600">
                      {res.acp}
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="w-full min-h-[60px] p-2 border border-slate-200 rounded bg-slate-100 text-sm text-slate-600">
                      {res.resultado}
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="w-full min-h-[60px] p-2 border border-slate-200 rounded bg-slate-100 text-sm text-slate-600">
                      {res.indicador}
                    </div>
                  </td>
                </tr>
                <tr className="border-b-4 border-slate-300 bg-slate-50/50">
                  <td colSpan={4} className="p-3 border-r border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">OBJETIVO DE GESTIÓN ASOCIADO AL PROYECTO</label>
                    <textarea 
                      className="w-full min-h-[60px] p-2 border border-slate-300 rounded resize-none focus:ring-1 focus:ring-primary outline-none text-sm text-slate-700"
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
      </div>
    </div>
  );
}
