import { decisionEngineExample } from "@/engine/decision/example"

export default function DecisionDebugPage() {
  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Decision Engine Debug</h1>

      <p>
        Resultado produzido pelo motor de decisão do ConsórcioOS.
      </p>

      <pre
        style={{
          marginTop: "24px",
          padding: "24px",
          overflowX: "auto",
          borderRadius: "8px",
          background: "#111827",
          color: "#f9fafb",
          whiteSpace: "pre-wrap",
        }}
      >
        {JSON.stringify(decisionEngineExample, null, 2)}
      </pre>
    </main>
  )
}