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
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={formData.pdes}
            onChange={(e) => updateFormData("pdes", e.target.value)}
          >
            <option value="">Seleccione PDES...</option>
            <option value="Eje 7">Eje 7: Educación, Investigación, Ciencia y Tecnología</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Plan de Desarrollo Universitario (PDU)
          </label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={formData.pdu}
            onChange={(e) => updateFormData("pdu", e.target.value)}
          >
            <option value="">Seleccione PDU...</option>
            <option value="1. Formación Profesional">1. Formación Profesional</option>
            <option value="2. Investigación Científica">2. Investigación Científica</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Plan Estratégico Institucional (PEI)
          </label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={formData.pei}
            onChange={(e) => updateFormData("pei", e.target.value)}
          >
            <option value="">Seleccione PEI...</option>
            <option value="192 - Acciones de Mejora Continua">192 - Acciones de Mejora Continua</option>
          </select>
        </div>
      </div>
    </div>
  );
}
