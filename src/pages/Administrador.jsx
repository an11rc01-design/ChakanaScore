import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";

export default function Administrador() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [avance, setAvance] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const respuesta = await fetch(`${API_URL}/categorias`);

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las categorías.");
        }

        const datos = await respuesta.json();

        setCategorias(datos);

        if (datos.length > 0) {
          setCategoriaId(String(datos[0].id));
        }
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      }
    }

    cargarCategorias();
  }, []);

  useEffect(() => {
    if (!categoriaId) {
      return undefined;
    }

    async function cargarInformacion() {
      try {
        const [respuestaAvance, respuestaResultados] =
          await Promise.all([
            fetch(`${API_URL}/avance-categoria/${categoriaId}`),
            fetch(`${API_URL}/resultados/${categoriaId}`),
          ]);

        if (!respuestaAvance.ok || !respuestaResultados.ok) {
          throw new Error("No se pudo cargar el estado de la categoría.");
        }

        const datosAvance = await respuestaAvance.json();
        const datosResultados = await respuestaResultados.json();

        setAvance(datosAvance);
        setResultados(datosResultados);
        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      } finally {
        setCargando(false);
      }
    }

    setCargando(true);
    cargarInformacion();

    const intervalo = setInterval(cargarInformacion, 3000);

    return () => clearInterval(intervalo);
  }, [categoriaId]);

  const categoriaActual = useMemo(
    () =>
      categorias.find(
        (categoria) =>
          String(categoria.id) === String(categoriaId)
      ),
    [categorias, categoriaId]
  );

  const totalParticipantes =
    avance.length > 0
      ? Number(avance[0].total_participantes)
      : 0;

  const competidoresCompletos = resultados.filter(
    (resultado) => Number(resultado.jurados_evaluados) === 5
  ).length;

  const todosLosJuradosTerminaron =
    avance.length === 5 &&
    avance.every(
      (jurado) =>
        Number(jurado.evaluados) ===
        Number(jurado.total_participantes)
    );

  function abrirPantallaPublica() {
    window.open("/publico", "_blank");
  }

  function siguienteCategoria() {
    const posicionActual = categorias.findIndex(
      (categoria) =>
        String(categoria.id) === String(categoriaId)
    );

    if (
      posicionActual >= 0 &&
      posicionActual < categorias.length - 1
    ) {
      setCategoriaId(
        String(categorias[posicionActual + 1].id)
      );
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
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <NavbarAdmin />
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#f5c542",
                letterSpacing: "4px",
                fontWeight: "bold",
              }}
            >
              CHAKANASCORE
            </p>

            <h1
              style={{
                margin: "8px 0 0",
                color: "#f5c542",
                fontSize: "42px",
              }}
            >
              Panel del Administrador
            </h1>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 20px",
              background: "#374151",
              color: "white",
              border: "1px solid #6b7280",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </header>

        <section
          style={{
            padding: "22px",
            marginBottom: "25px",
            background: "#1f2937",
            borderRadius: "15px",
          }}
        >
          <label
            htmlFor="categoria-admin"
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "18px",
            }}
          >
            Categoría en control
          </label>

          <select
            id="categoria-admin"
            value={categoriaId}
            onChange={(evento) =>
              setCategoriaId(evento.target.value)
            }
            style={{
              width: "100%",
              padding: "14px",
              border: "2px solid #f5c542",
              borderRadius: "10px",
              fontSize: "20px",
            }}
          >
            {categorias.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>
        </section>

        <h2
          style={{
            textAlign: "center",
            color: "#f5c542",
            fontSize: "34px",
          }}
        >
          {categoriaActual?.nombre || "Categoría"}
        </h2>

        {cargando && <p>Cargando información...</p>}

        {error && (
          <p
            style={{
              padding: "15px",
              background: "#7f1d1d",
              color: "#fecaca",
              borderRadius: "10px",
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          {avance.map((jurado) => {
            const total = Number(jurado.total_participantes);
            const evaluados = Number(jurado.evaluados);

            const porcentaje =
              total > 0
                ? Math.round((evaluados / total) * 100)
                : 0;

            const terminado =
              total > 0 && evaluados === total;

            return (
              <article
                key={jurado.id}
                style={{
                  padding: "20px",
                  background: "#1f2937",
                  border: terminado
                    ? "2px solid #22c55e"
                    : "1px solid #4b5563",
                  borderRadius: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "23px",
                      }}
                    >
                      {jurado.visible === 0 ? "🎭" : "👨‍⚖️"}{" "}
                      {jurado.nombre}
                    </h3>

                    {jurado.visible === 0 && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "#f5c542",
                        }}
                      >
                        Jurado incógnito
                      </p>
                    )}
                  </div>

                  <strong
                    style={{
                      fontSize: "22px",
                      color: terminado
                        ? "#22c55e"
                        : "#f5c542",
                    }}
                  >
                    {evaluados} / {total}
                  </strong>
                </div>

                <div
                  style={{
                    height: "13px",
                    marginTop: "15px",
                    overflow: "hidden",
                    borderRadius: "999px",
                    background: "#4b5563",
                  }}
                >
                  <div
                    style={{
                      width: `${porcentaje}%`,
                      height: "100%",
                      background: terminado
                        ? "#22c55e"
                        : "#f5c542",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <p
                  style={{
                    margin: "9px 0 0",
                    color: "#d1d5db",
                  }}
                >
                  {terminado
                    ? "✅ Evaluación completada"
                    : `${porcentaje}% completado`}
                </p>
              </article>
            );
          })}
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginTop: "30px",
          }}
        >
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              background: "#1f2937",
              border: "2px solid #f5c542",
              borderRadius: "14px",
            }}
          >
            <p style={{ margin: 0, color: "#d1d5db" }}>
              Competidores completos
            </p>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                color: "#f5c542",
                fontSize: "42px",
              }}
            >
              {competidoresCompletos} / {totalParticipantes}
            </strong>
          </div>

          <div
            style={{
              padding: "24px",
              textAlign: "center",
              background: todosLosJuradosTerminaron
                ? "#14532d"
                : "#1f2937",
              border: todosLosJuradosTerminaron
                ? "2px solid #22c55e"
                : "1px solid #4b5563",
              borderRadius: "14px",
            }}
          >
            <p style={{ margin: 0, color: "#d1d5db" }}>
              Estado de la categoría
            </p>

            <strong
              style={{
                display: "block",
                marginTop: "10px",
                fontSize: "24px",
                color: todosLosJuradosTerminaron
                  ? "#22c55e"
                  : "#f5c542",
              }}
            >
              {todosLosJuradosTerminaron
                ? "✅ Categoría completa"
                : "⏳ Evaluaciones pendientes"}
            </strong>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginTop: "30px",
          }}
        >
          <button
            onClick={abrirPantallaPublica}
            style={{
              padding: "17px",
              background: "#f5c542",
              color: "#111827",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📺 Abrir pantalla pública
          </button>

          <button
            onClick={siguienteCategoria}
            disabled={
              categorias.findIndex(
                (categoria) =>
                  String(categoria.id) ===
                  String(categoriaId)
              ) ===
              categorias.length - 1
            }
            style={{
              padding: "17px",
              background: "#374151",
              color: "white",
              border: "1px solid #6b7280",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Siguiente categoría →
          </button>
        </section>
      </div>
    </div>
  );
}