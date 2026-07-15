import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://chakanascore.onrender.com";

const criterios = [
  {
    campo: "danza",
    nombre: "Manejo de la danza y coreografía",
  },
  {
    campo: "creatividad",
    nombre: "Creatividad en la puesta en escena y temática",
  },
  {
    campo: "espacio",
    nombre: "Uso del espacio e interacción con el público",
  },
  {
    campo: "mensaje",
    nombre: "Mensaje en su coreografía",
  },
  {
    campo: "interpretacion",
    nombre: "Interpretación y expresión corporal",
  },
];

export default function Evaluacion() {
  const { participanteId } = useParams();
  const navigate = useNavigate();

  const juradoId = Number(localStorage.getItem("jurado"));
  const nombreJurado =
    localStorage.getItem("nombreJurado") || "Jurado no identificado";

  const [participante, setParticipante] = useState(null);

  const [puntajes, setPuntajes] = useState({
    danza: 1,
    creatividad: 1,
    espacio: 1,
    mensaje: 1,
    interpretacion: 1,
    descuento: 0,
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [bloqueada, setBloqueada] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function cargarParticipante() {
      try {
        const respuesta = await fetch(
          `${API_URL}/participante/${participanteId}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el competidor.");
        }

        const datos = await respuesta.json();
        setParticipante(datos);
      } catch (error) {
        console.error(error);
        setMensaje(`❌ ${error.message}`);
      }
    }

    cargarParticipante();
  }, [participanteId]);

  useEffect(() => {
    async function verificarEvaluacion() {
      try {
        if (!juradoId) {
          navigate("/");
          return;
        }

        const respuesta = await fetch(
          `${API_URL}/puntajes/${participanteId}/${juradoId}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo verificar la evaluación.");
        }

        const evaluacionExistente = await respuesta.json();

        if (evaluacionExistente?.id) {
  setPuntajes({
    danza: Number(evaluacionExistente.danza),
    creatividad: Number(evaluacionExistente.creatividad),
    espacio: Number(evaluacionExistente.espacio),
    mensaje: Number(evaluacionExistente.mensaje),
    interpretacion: Number(evaluacionExistente.interpretacion),
    descuento: Number(evaluacionExistente.descuento || 0),
  });
}

if (Number(evaluacionExistente?.categoria_cerrada) === 1) {
  setBloqueada(true);
}

}
      } catch (error) {
        console.error(error);
        setMensaje(`❌ ${error.message}`);
      } finally {
        setVerificando(false);
      }
    }

    verificarEvaluacion();
  }, [participanteId, juradoId, navigate]);

  const total = useMemo(() => {
    const subtotal =
      puntajes.danza +
      puntajes.creatividad +
      puntajes.espacio +
      puntajes.mensaje +
      puntajes.interpretacion;

    return Math.max(0, subtotal - puntajes.descuento);
  }, [puntajes]);

  function cambiarPuntaje(campo, valor) {
    setPuntajes((anteriores) => ({
      ...anteriores,
      [campo]: Number(valor),
    }));
  }

  async function guardarEvaluacion() {
    if (bloqueada || guardando) {
      return;
    }

    if (!juradoId) {
      setMensaje("❌ No se pudo identificar al jurado.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/puntajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participante_id: Number(participanteId),
          jurado_id: juradoId,
          ...puntajes,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo guardar la evaluación."
        );
      }

      setBloqueada(true);
      setMensaje(
        `✅ Evaluación guardada. Total: ${resultado.total} puntos`
      );

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      console.error(error);
      setMensaje(`❌ ${error.message}`);
    } finally {
      setGuardando(false);
    }
  }

  if (verificando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111827",
          color: "white",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <p>Verificando evaluación...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "35px 20px",
        boxSizing: "border-box",
        background: "#111827",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "#374151",
            color: "white",
            border: "1px solid #6b7280",
            padding: "11px 18px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Volver
        </button>

        <h2
          style={{
            marginTop: "25px",
            marginBottom: "5px",
            fontWeight: "normal",
          }}
        >
          👨‍⚖️ {nombreJurado}
        </h2>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "40px",
            margin: "8px 0 20px",
          }}
        >
          Rúbrica de evaluación
        </h1>

        <section
          style={{
            padding: "22px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#d1d5db",
              fontSize: "22px",
            }}
          >
            {participante?.categoria || "Cargando categoría..."}
          </h3>

          <h1
            style={{
              margin: "10px 0 5px",
              color: "#f5c542",
              fontSize: "clamp(58px, 12vw, 90px)",
              letterSpacing: "4px",
            }}
          >
            {participante?.codigo || `N.º ${participanteId}`}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: "17px",
            }}
          >
            {participante?.nombre || "Cargando competidor..."}
          </p>
        </section>

        {bloqueada && participante?.categoria_cerrada === 1 ? (
          <div
            style={{
              marginTop: "30px",
              padding: "25px",
              background: "#14532d",
              border: "2px solid #22c55e",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              ✅ Este competidor ya fue evaluado por usted
            </h2>

            <button
              onClick={() => navigate(-1)}
              style={{
                marginTop: "10px",
                padding: "13px 24px",
                background: "#f5c542",
                color: "#111827",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Volver a competidores
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: "25px",
                background: "#1f2937",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              {criterios.map((criterio, indice) => (
                <div
                  key={criterio.campo}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) minmax(90px, 130px)",
                    gap: "20px",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom:
                      indice < criterios.length - 1
                        ? "1px solid #374151"
                        : "none",
                  }}
                >
                  <label
                    htmlFor={criterio.campo}
                    style={{
                      fontSize: "18px",
                      lineHeight: 1.4,
                    }}
                  >
                    {criterio.nombre}
                  </label>

                  <select
                    id={criterio.campo}
                    value={puntajes[criterio.campo]}
                    onChange={(evento) =>
                      cambiarPuntaje(
                        criterio.campo,
                        evento.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      fontSize: "18px",
                      borderRadius: "8px",
                      border: "1px solid #6b7280",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                      (numero) => (
                        <option key={numero} value={numero}>
                          {numero}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ))}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) minmax(90px, 130px)",
                  gap: "20px",
                  alignItems: "center",
                  paddingTop: "20px",
                }}
              >
                <label htmlFor="descuento" style={{ fontSize: "18px" }}>
                  Descuentos extras
                </label>

                <input
                  id="descuento"
                  type="number"
                  min="0"
                  max="50"
                  value={puntajes.descuento}
                  onChange={(evento) =>
                    cambiarPuntaje("descuento", evento.target.value)
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "1px solid #6b7280",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                background: "#1f2937",
                border: "2px solid #f5c542",
                borderRadius: "14px",
                padding: "22px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#d1d5db",
                }}
              >
                Puntaje total
              </p>

              <h2
                style={{
                  margin: "8px 0 0",
                  color: "#f5c542",
                  fontSize: "42px",
                }}
              >
                {total} / 50
              </h2>
            </div>

            <button
              onClick={guardarEvaluacion}
              disabled={guardando}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "17px",
                background: guardando ? "#6b7280" : "#f5c542",
                color: "#111827",
                border: "none",
                borderRadius: "10px",
                fontSize: "20px",
                fontWeight: "bold",
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
             {guardando
  ? "Guardando..."
  : "Guardar / Actualizar evaluación"}
            </button>
          </>
        )}

        {mensaje && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: mensaje.startsWith("✅")
                ? "#14532d"
                : "#7f1d1d",
              borderRadius: "9px",
              textAlign: "center",
            }}
          >
            <strong>{mensaje}</strong>
          </div>
        )}
      </div>
    </div>
  );
}