"use client";

import { ResultadoPrincipal } from "@/types/poa";
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
          <h2 className="text-2xl font-bold text-primary font-serif">2. Programación a Corto Plazo</h2>
          <p className="text-slate-500 text-sm">Defina las acciones de corto plazo, los resultados esperados y su objetivo de gestión asociado.</p>
        </div>
      </div>

      <div className="space-y-8">
        {resultadosPrincipales.map((res, index) => {
          return (
            <div 
              key={res.id} 
              className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Institutional Header Bar */}
              <div className="bg-primary text-white px-4 py-2.5 flex items-center gap-2">
                <span className="bg-white/20 text-white font-serif px-2 py-0.5 rounded text-sm font-black">
                  {index + 1}
                </span>
                <h3 className="font-bold text-sm font-serif uppercase tracking-wider">
                  Articulación y Programación de Operaciones (PEI - POA)
                </h3>
              </div>

              {/* Form Grid Structure */}
              <div className="divide-y divide-slate-200 text-sm">
                
                {/* Row 1: ACP */}
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 bg-slate-50 p-4 font-bold text-slate-700 border-r border-slate-200 flex items-center shrink-0 uppercase text-xs tracking-wider">
                    Acción de Corto Plazo (ACP)
                  </div>
                  <div className="flex-1 p-4 text-slate-800 font-semibold bg-white uppercase">
                    {res.acp || "No definido"}
                  </div>
                </div>

                {/* Row 2: Resultado */}
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 bg-slate-50 p-4 font-bold text-slate-700 border-r border-slate-200 flex items-center shrink-0 uppercase text-xs tracking-wider">
                    Resultado Principal Esperado
                  </div>
                  <div className="flex-1 p-4 text-slate-800 leading-relaxed bg-white">
                    {res.resultado || "No definido"}
                  </div>
                </div>

                {/* Row 3: Indicador */}
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 bg-slate-50 p-4 font-bold text-slate-700 border-r border-slate-200 flex items-center shrink-0 uppercase text-xs tracking-wider">
                    Indicador Principal
                  </div>
                  <div className="flex-1 p-4 text-slate-800 leading-relaxed bg-white">
                    {res.indicador || "No definido"}
                  </div>
                </div>

                {/* Row 4: Objetivo de Gestión */}
                <div className="flex flex-col">
                  <div className="bg-slate-50 px-4 py-3 font-bold text-slate-700 border-b border-slate-200 uppercase text-xs tracking-wider flex justify-between items-center">
                    <span>Objetivo de Gestión Asociado al Proyecto</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">Este campo es editable</span>
                  </div>
                  <div className="p-4 bg-white">
                    <textarea
                      className="w-full min-h-[120px] p-3 border border-slate-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-y text-slate-800 leading-relaxed placeholder:text-slate-400 placeholder:italic bg-slate-50/30 hover:bg-white focus:bg-white"
                      placeholder="Describa el objetivo de gestión y propósito de este resultado principal en el POA de su unidad..."
                      value={res.objetivoGestion}
                      onChange={(e) => updateResultadoPrincipal(res.id, "objetivoGestion", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
