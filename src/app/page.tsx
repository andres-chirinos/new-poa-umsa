import { Wizard } from "@/components/Wizard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations - UMSA Colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full px-2 z-10">
        <header className="mb-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-white shadow-md border border-slate-200 rounded-2xl mb-2">
            <img src="/logo_umsa.png" alt="Logo UMSA" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
            UNIVERSIDAD MAYOR DE SAN ANDRÉS
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Formulario del Plan Operativo Anual (POA)
          </p>
        </header>

        <Wizard />
      </div>
    </main>
  );
}
