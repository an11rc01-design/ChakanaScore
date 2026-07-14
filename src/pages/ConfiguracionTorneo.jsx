import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "http://localhost:3001";

export default function ConfiguracionTorneo() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: "",
    lugar: "",
    fecha: "",
    jurados: 5,
    incognito: true,
  });

  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/torneo`)
      .then((respuesta) => respuesta.json())
      .then((torneo) => {
        if (!torneo) return;

        setFormulario({
          nombre: torneo.nombre || "",
          lugar: torneo.lugar || "",
          fecha: torneo.fecha || "",
          jurados: torneo.jurados || 5,
          incognito: torneo.incognito === 1,
        });
      });
  }, []);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function guardarTorneo() {
    setGuardando(true);
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/torneo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo guardar el torneo."
        );
      }

      setMensaje("✅ Torneo guardado correctamente.");
    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "35px 20px",
        background: "#111827",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
          ← Volver
        </button>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "40px",
          }}
        >
          Configuración del torneo
        </h1>

        <div
          style={{
            display: "grid",
            gap: "18px",
            background: "#1f2937",
            padding: "24px",
            borderRadius: "14px",
          }}
        >
          <label>
            Nombre del torneo
            <input
              value={formulario.nombre}
              onChange={(e) =>
                cambiar("nombre", e.target.value)
              }
              style={estiloInput}
            />
          </label>

          <label>
            Lugar
            <input
              value={formulario.lugar}
              onChange={(e) =>
                cambiar("lugar", e.target.value)
              }
              style={estiloInput}
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={formulario.fecha}
              onChange={(e) =>
                cambiar("fecha", e.target.value)
              }
              style={estiloInput}
            />
          </label>

          <label>
            Cantidad de jurados
            <input
              type="number"
              min="1"
              value={formulario.jurados}
              onChange={(e) =>
                cambiar("jurados", Number(e.target.value))
              }
              style={estiloInput}
            />
          </label>

          <label
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={formulario.incognito}
              onChange={(e) =>
                cambiar("incognito", e.target.checked)
              }
            />
            Usar jurado incógnito
          </label>

          <button
            onClick={guardarTorneo}
            disabled={guardando}
            style={{
              padding: "16px",
              background: "#f5c542",
              color: "#111827",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {guardando ? "Guardando..." : "Guardar torneo"}
          </button>
        </div>

        {mensaje && <p>{mensaje}</p>}
      </div>
    </div>
  );
}

const estiloInput = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "8px",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #6b7280",
  fontSize: "17px",
};