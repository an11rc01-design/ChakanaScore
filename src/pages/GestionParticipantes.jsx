import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";

export default function GestionParticipantes() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/categorias`)
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        setCategorias(datos);

        if (datos.length > 0) {
          setCategoriaId(String(datos[0].id));
        }
      });
  }, []);

  useEffect(() => {
    if (!categoriaId) {
      return;
    }

    fetch(`${API_URL}/participantes/${categoriaId}`)
      .then((respuesta) => respuesta.json())
      .then((datos) => setParticipantes(datos));
  }, [categoriaId]);

  function cambiarNombre(id, nombre) {
    setParticipantes((anteriores) =>
      anteriores.map((participante) =>
        participante.id === id
          ? { ...participante, nombre }
          : participante
      )
    );
  }

  async function guardarParticipante(participante) {
    setGuardandoId(participante.id);
    setMensaje("");

    try {
      const respuesta = await fetch(
        `${API_URL}/participantes/${participante.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: participante.nombre,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo guardar el nombre."
        );
      }

      setMensaje(`✅ ${participante.nombre} guardado correctamente.`);
    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setGuardandoId(null);
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
          ← Volver al administrador
        </button>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "40px",
          }}
        >
          Gestión de competidores
        </h1>

        <label
          htmlFor="categoria-participantes"
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "18px",
          }}
        >
          Seleccione una categoría
        </label>

        <select
          id="categoria-participantes"
          value={categoriaId}
          onChange={(evento) =>
            setCategoriaId(evento.target.value)
          }
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "25px",
            borderRadius: "10px",
            fontSize: "19px",
          }}
        >
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>

        <div style={{ display: "grid", gap: "14px" }}>
          {participantes.map((participante, indice) => (
            <div
              key={participante.id}
              style={{
                display: "grid",
                gridTemplateColumns: "55px 1fr 130px",
                gap: "15px",
                alignItems: "center",
                padding: "16px",
                background: "#1f2937",
                border: "1px solid #4b5563",
                borderRadius: "12px",
              }}
            >
              <strong
                style={{
                  textAlign: "center",
                  color: "#f5c542",
                  fontSize: "20px",
                }}
              >
                {indice + 1}
              </strong>

              <input
                type="text"
                value={participante.nombre}
                onChange={(evento) =>
                  cambiarNombre(
                    participante.id,
                    evento.target.value
                  )
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #6b7280",
                  fontSize: "17px",
                }}
              />

              <button
                onClick={() =>
                  guardarParticipante(participante)
                }
                disabled={guardandoId === participante.id}
                style={{
                  padding: "12px",
                  background: "#f5c542",
                  color: "#111827",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {guardandoId === participante.id
                  ? "Guardando..."
                  : "Guardar"}
              </button>
            </div>
          ))}
        </div>

        {mensaje && (
          <p
            style={{
              marginTop: "20px",
              padding: "14px",
              background: mensaje.startsWith("✅")
                ? "#14532d"
                : "#7f1d1d",
              borderRadius: "9px",
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