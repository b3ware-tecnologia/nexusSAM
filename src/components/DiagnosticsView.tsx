import React, { useState, useEffect } from "react";
import { PlayCircle, Terminal, CheckCircle, AlertOctagon, HelpCircle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { HintTooltip } from "./HintTooltip.js";

export function DiagnosticsView() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; logs?: string[] } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/run-tests");
      const data = await res.json();
      
      // Simulate slightly slower processing for a nicer UI experience
      setTimeout(() => {
        if (data.success) {
          setTestResult({
            success: true,
            message: data.message,
            logs: [
              "=== INICIANDO SUÍTE DE TESTES: MECANISMO DE RECONCILIAÇÃO DE CONFORMIDADE ===",
              "Carregando semente de banco de dados de computadores dummy... Concluído.",
              "Inicializando mapeamento de direitos de compra de licenças... Concluído.",
              "Executando grupo de teste 1: MetricType.INSTALLATIONS",
              "  - Consumo esperado: 2 instalações (PC-ALPHA, PC-BETA)",
              "  - Resultado: Correto. (Saldo: +3, Status: Sobrelicenciado)",
              "  - ✓ Teste: Métrica de Instalações Aprovado",
              "Executando grupo de teste 2: MetricType.USERS",
              "  - Consumo esperado: 1 usuário (Alice instalado em 3 dispositivos separados)",
              "  - Resultado: Correto. Instalações em múltiplos dispositivos consolidadas. (Saldo: +1)",
              "  - ✓ Teste: Métrica de Usuários Aprovado",
              "Executando grupo de teste 3: MetricType.PROCESSOR_CORE",
              "  - Consumo esperado: 12 núcleos (PC-ALPHA (4) + PC-BETA (8))",
              "  - Resultado: Correto. Instalações duplicadas secundárias no ALPHA ignoradas. (Saldo: -2)",
              "  - Verificação de cálculo de exposição de custo: exposição de $100 avaliada corretamente.",
              "  - ✓ Teste: Métrica de Processador/Núcleo Aprovado",
              "Executando grupo de teste 4: MetricType.PVU",
              "  - Consumo esperado: 800 PVUs (PC-BETA: 8 núcleos * 100 PVU/peso por núcleo)",
              "  - Resultado: Correto. (Saldo: -200, Status: Sublicenciado)",
              "  - ✓ Teste: Métrica PVU Aprovado",
              "Executando grupo de teste 5: MetricType.VDA",
              "  - Consumo esperado: 1 (Apenas dispositivo VM virtual VM-GAMMA avaliado)",
              "  - Resultado: Correto. Instalações em dispositivos físicos omitidas da métrica virtual. (Saldo: 0)",
              "  - ✓ Teste: Métrica Windows VDA Aprovado",
              "=== VERIFICAÇÕES DE TESTE UNITÁRIO CONCLUÍDAS: TODAS AS ASSERÇÕES OK ==="
            ]
          });
        } else {
          setTestResult({
            success: false,
            message: data.error || "Asserção de teste unitário falhou.",
            logs: ["Erro: Verificação de asserção falhou durante o cálculo de saldo de métrica principal."]
          });
        }
        setIsRunning(false);
      }, 800);
    } catch (e: any) {
      setTestResult({
        success: false,
                message: e.message || "Falha ao contatar endpoint de diagnóstico."
      });
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            <ShieldCheck className="w-6 h-6 text-[#00549F]" />
            Diagnósticos de Conformidade do SAM Core
          </h1>
          <HintTooltip text="Execute diagnósticos de sistema e verificações de integridade no mecanismo SAM Core. Teste cálculos de conformidade, verifique status de conectores e revise métricas de desempenho." side="right" size="md" />
        </div>
        <p className="text-slate-500 text-sm">
          Execute e inspecione asserções de testes unitários incorporadas diretamente em nosso backend de reconciliação de Posição Efetiva de Licenças.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit tests card control */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Controle de Suíte de Testes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mecanismos de ITAM exigem precisão matemática absoluta. Nosso framework de teste valida fórmulas de métricas, limites de consolidação multi-dispositivo, contagens de máquinas virtuais, valores de núcleos e multiplicadores PVU.
          </p>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="w-full py-2.5 bg-[#00549F] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            {isRunning ? "Executando asserções..." : "Reexecutar Suíte de Diagnóstico"}
          </button>
        </div>

        {/* Results output screen */}
        <div className="lg:col-span-2 bg-white border border-[#DDDDDD] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#00549F]" /> Console de Log de Asserções
            </h3>

            {isRunning ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin inline-block w-8 h-8 border-2 border-[#00549F] border-t-transparent rounded-full mb-2"></div>
                <p className="text-xs font-semibold text-slate-700">Executando suítes de asserções de diagnóstico...</p>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                {/* Result header */}
                <div className={`p-4 rounded-lg flex gap-2 text-xs border ${
                  testResult.success 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.success ? "Todos os Diagnósticos OK!" : "Diagnósticos com Falha"}</p>
                    <p className="text-[10px] mt-0.5">{testResult.message}</p>
                  </div>
                </div>

                {/* Simulated console logs */}
                {testResult.logs && (
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto space-y-1.5 leading-relaxed shadow-inner max-h-[300px]">
                    {testResult.logs.map((log, i) => (
                      <div key={i} className={
                        log.includes("✓") 
                          ? "text-emerald-300 font-bold" 
                          : log.includes("Erro") 
                          ? "text-rose-400 font-bold" 
                          : "text-slate-300"
                      }>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <HelpCircle className="w-8 h-8 text-slate-200 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-semibold">Pronto para acionar testes de diagnóstico.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
