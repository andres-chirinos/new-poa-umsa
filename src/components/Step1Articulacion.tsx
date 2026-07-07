"use client";

import { FormDataPOA } from "@/types/poa";

interface Props {
  formData: FormDataPOA;
  updateFormData: (field: string, value: string) => void;
}

export function Step1Articulacion({ formData, updateFormData }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-primary mb-6">1. Articulación PEI-POA</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Plan de Desarrollo Económico y Social (PDES)
          </label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 appearance-none outline-none cursor-not-allowed"
            value={formData.pdes}
            disabled
          >
            <option value="Eje 7">Eje 7: Educación, Investigación, Ciencia y Tecnología</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Plan de Desarrollo Universitario (PDU)
          </label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 appearance-none outline-none cursor-not-allowed"
            value={formData.pdu}
            disabled
          >
            <option value="1. Formación Profesional">1. Formación Profesional</option>
            <option value="2. Investigación Científica">2. Investigación Científica</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Plan Estratégico Institucional (PEI)
          </label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 appearance-none outline-none cursor-not-allowed"
            value={formData.pei}
            disabled
          >
            <option value="192 - Acciones de Mejora Continua">192 - Acciones de Mejora Continua</option>
          </select>
        </div>
      </div>
    </div>
  );
}
