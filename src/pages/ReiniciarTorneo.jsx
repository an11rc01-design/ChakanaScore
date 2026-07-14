import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";

export default function ReiniciarTorneo() {
  const navigate = useNavigate();

  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [reiniciando, setReiniciando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function reiniciar() {
    if (confirmacion !== "REINICIAR") {
      setMensaje('❌ Escribe exactamente "REINICIAR".');
      return;
    }

    if (!clave) {
      setMensaje("❌ Ingresa la clave de administrador.");
      return;
    }

    const aceptado = window.confirm(
      "¿Está completamente seguro? Se eliminarán todos los puntajes guardados."
    );

    if (!aceptado) {
      return;
    }

    setReiniciando(true);
    setMensaje("");

    try {
      const respuesta = await fetch(
        `${API_URL}/admin/reiniciar-puntajes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clave }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo reiniciar el torneo."
        );
      }

      setMensaje(
        `✅ Torneo reiniciado. Se eliminaron ${resultado.evaluaciones_eliminadas} evaluaciones.`
      );

      setClave("");
      setConfirmacion("");
    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setReiniciando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "35px 20px",
        boxSizing: "border-box",
        background: "#111827",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <NavbarAdmin />

        <button
          onClick={() => navigate("/administrador")}
          style={{
            padding: "11px 18px",
            background: "#374151",
            color: "white",
            border: "1px solid #6b7280",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Volver al administrador
        </button>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "40px",
          }}
        >
          Reiniciar torneo
        </h1>

        <div
          style={{
            marginTop: "25px",
            padding: "26px",
            background: "#450a0a",
            border: "2px solid #ef4444",
            borderRadius: "15px",
          }}
        >
          <h2 style={{ color: "#fca5a5", marginTop: 0 }}>
            ⚠️ Zona peligrosa
          </h2>

          <p style={{ lineHeight: 1.6 }}>
            Esta acción eliminará todas las evaluaciones y puntajes.
            Los competidores, códigos, categorías y jurados no serán
            eliminados.
          </p>

          <label style={estiloLabel}>
            Clave de administrador
            <input
              type="password"
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
              style={estiloInput}
            />
          </label>

          <label style={estiloLabel}>
            Escribe REINICIAR para confirmar
            <input
              value={confirmacion}
              onChange={(evento) =>
                setConfirmacion(evento.target.value.toUpperCase())
              }
              placeholder="REINICIAR"
              style={estiloInput}
            />
          </label>

          <button
            onClick={reiniciar}
            disabled={reiniciando}
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "17px",
              background: reiniciando ? "#6b7280" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "19px",
              fontWeight: "bold",
              cursor: reiniciando ? "not-allowed" : "pointer",
            }}
          >
            {reiniciando
              ? "Reiniciando..."
              : "🗑️ Eliminar evaluaciones y reiniciar"}
          </button>
        </div>

        {mensaje && (
          <p
            style={{
              marginTop: "20px",
              padding: "15px",
              background: mensaje.startsWith("✅")
                ? "#14532d"
                : "#7f1d1d",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
}

const estiloLabel = {
  display: "block",
  marginTop: "20px",
  fontSize: "17px",
  fontWeight: "bold",
};

const estiloInput = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "8px",
  padding: "13px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "17px",
};