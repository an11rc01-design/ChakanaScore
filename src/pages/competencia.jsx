import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Competencia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [participantes, setParticipantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const juradoId = Number(localStorage.getItem("jurado"));
  const nombreJurado =
    localStorage.getItem("nombreJurado") || "Jurado no identificado";

  useEffect(() => {
    async function cargarParticipantes() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `https://chakanascore.onrender.com/participantes/${id}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los competidores.");
        }

        const datos = await respuesta.json();

        const participantesRevisados = await Promise.all(
          datos.map(async (participante) => {
            const respuestaPuntaje = await fetch(
              `https://chakanascore.onrender.com/puntajes/${participante.id}/${juradoId}`
            );

            if (!respuestaPuntaje.ok) {
              throw new Error("No se pudo revisar el estado de evaluación.");
            }

            const evaluacion = await respuestaPuntaje.json();

            return {
              ...participante,
              evaluado: Boolean(evaluacion?.id),
            };
          })
        );

        setParticipantes(participantesRevisados);
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      } finally {
        setCargando(false);
      }
    }

    if (!juradoId) {
      navigate("/");
      return;
    }

    cargarParticipantes();
  }, [id, juradoId, navigate]);

  const evaluados = useMemo(
    () => participantes.filter((participante) => participante.evaluado).length,
    [participantes]
  );

  const porcentaje =
    participantes.length > 0
      ? Math.round((evaluados / participantes.length) * 100)
      : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "35px 20px",
        background: "#111827",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "950px", margin: "0 auto" }}>
        <button
          onClick={() => navigate("/panel")}
          style={{
            background: "#374151",
            color: "white",
            border: "1px solid #6b7280",
            padding: "11px 18px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Volver a categorías
        </button>

        <h2 style={{ marginTop: "25px", fontWeight: "normal" }}>
          👨‍⚖️ {nombreJurado}
        </h2>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "40px",
            marginBottom: "10px",
          }}
        >
          Competidores
        </h1>

        {!cargando && participantes.length > 0 && (
          <div
            style={{
              background: "#1f2937",
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <strong>Progreso de evaluación</strong>
              <span>
                {evaluados} de {participantes.length}
              </span>
            </div>

            <div
              style={{
                height: "14px",
                background: "#374151",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${porcentaje}%`,
                  height: "100%",
                  background: "#f5c542",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <p style={{ marginBottom: 0 }}>{porcentaje}% completado</p>
          </div>
        )}

        {cargando && <p>Cargando competidores...</p>}

        {error && (
          <p
            style={{
              background: "#7f1d1d",
              color: "#fecaca",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {participantes.map((participante) => (
            <div
              key={participante.id}
              style={{
                background: "#1f2937",
                border: participante.evaluado
                  ? "2px solid #22c55e"
                  : "2px solid #f5c542",
                borderRadius: "14px",
                padding: "22px",
              }}
            >
              <h2
  style={{
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "42px",
    color: "#f5c542",
    textAlign: "center",
  }}
>
  {participante.codigo}
</h2>

<p
  style={{
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
    minHeight: "40px",
    marginBottom: "20px",
  }}
>
  {participante.nombre}
</p>

              <button
  onClick={() =>
    navigate(`/evaluacion/${participante.id}`)
  }
  style={{
    width: "100%",
    padding: "13px",
    background: participante.evaluado
      ? "#166534"
      : "#f5c542",
    color: participante.evaluado
      ? "white"
      : "#111827",
    border: "none",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {participante.evaluado
    ? "✏️ Editar evaluación"
    : "Calificar"}
</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}