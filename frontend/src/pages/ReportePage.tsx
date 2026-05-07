import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [fecha, setFecha] = useState("");
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const enviarReporte = async () => {
    setMensaje(null);

    if (!fecha || !correo) {
      setMensaje({ tipo: "error", texto: "Completa la fecha y el correo" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/reporte", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        // ✅ TRUCO FINAL: Enviamos la misma fecha para inicio y fin 
        // para que el backend deje de dar el error de "requeridos"
        body: JSON.stringify({ 
          fechaInicio: fecha, 
          fechaFin: fecha, 
          fecha: fecha,
          destinatario: correo 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error en el servidor");

      setMensaje({ tipo: "ok", texto: data.message || "Reporte enviado con éxito" });
      setFecha(""); 
      setCorreo(""); 
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111827", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "#1f2937", 
        border: "1px solid #374151",
        borderRadius: "16px",
        padding: "40px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{
            background: "#3b82f6",
            borderRadius: "10px",
            width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px",
            color: "white"
          }}>📊</div>
          <h2 style={{ color: "white", margin: 0, fontSize: "22px", fontWeight: 700 }}>
            Enviar Reporte
          </h2>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "32px" }}>
          Genera el reporte de asistencia de un día específico
        </p>

        {mensaje && (
          <div style={{
            background: mensaje.tipo === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${mensaje.tipo === "ok" ? "#22c55e" : "#ef4444"}`,
            borderRadius: "8px",
            padding: "12px 16px",
            color: mensaje.tipo === "ok" ? "#4ade80" : "#f87171",
            fontSize: "14px",
            marginBottom: "20px",
          }}>
            {mensaje.tipo === "ok" ? "✅ " : "❌ "}{mensaje.texto}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
            Fecha del reporte
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px",
              background: "#111827", border: "1px solid #374151",
              borderRadius: "10px", color: "white", fontSize: "14px",
              boxSizing: "border-box", outline: "none"
            }}
          />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
            Correo destino
          </label>
          <input
            type="email"
            placeholder="correo@empresa.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px",
              background: "#111827", border: "1px solid #374151",
              borderRadius: "10px", color: "white", fontSize: "14px",
              boxSizing: "border-box", outline: "none"
            }}
          />
        </div>

        <button
          onClick={enviarReporte}
          disabled={loading}
          style={{
            width: "100%", padding: "14px",
            background: loading ? "#1d4ed8" : "#3b82f6",
            color: "white", border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "12px", transition: "0.2s"
          }}
        >
          {loading ? "Enviando..." : "Enviar Reporte"}
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            width: "100%", padding: "12px",
            background: "transparent", color: "#6b7280",
            border: "1px solid #374151", borderRadius: "12px",
            fontSize: "14px", cursor: "pointer", transition: "0.2s"
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}