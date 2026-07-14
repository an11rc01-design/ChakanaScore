import { useEffect, useMemo, useState } from "react";

const API_URL = "https://chakanascore.onrender.com";

export default function Publico() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const respuesta = await fetch(
          `${API_URL}/categorias`
        );

        if (!respuesta.ok) {
          throw new Error(
            "No se pudieron cargar las categorías."
          );
        }

        const datos = await respuesta.json();

        setCategorias(datos);

        if (datos.length > 0) {
          setCategoriaId(String(datos[0].id));
        }
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
        setCargando(false);
      }
    }

    cargarCategorias();
  }, []);

  useEffect(() => {
    if (!categoriaId) {
      return undefined;
    }

    async function cargarResultados() {
      try {
        const respuesta = await fetch(
          `${API_URL}/resultados/${categoriaId}`
        );

        if (!respuesta.ok) {
          throw new Error(
            "No se pudieron cargar los resultados."
          );
        }

        const datos = await respuesta.json();

        setResultados(datos);
        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      } finally {
        setCargando(false);
      }
    }

    cargarResultados();

    const intervalo = setInterval(
      cargarResultados,
      3000
    );

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

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "35px 25px",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
        background:
          "radial-gradient(circle at top, #4c3a0a 0%, #111827 42%, #030712 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#f5c542",
              letterSpacing: "5px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            LA CHAKANA SAGRADA 2026
          </p>

          <h1
            style={{
              margin: "10px 0",
              color: "#f5c542",
              fontSize: "clamp(42px, 6vw, 72px)",
            }}
          >
            🏆 ChakanaScore
          </h1>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: "normal",
            }}
          >
            Resultados en vivo
          </h2>
        </header>

        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto 32px",
          }}
        >
          <label
            htmlFor="categoria-publica"
            style={{
              display: "block",
              marginBottom: "10px",
              textAlign: "center",
              fontSize: "18px",
            }}
          >
            Seleccionar categoría
          </label>

          <select
            id="categoria-publica"
            value={categoriaId}
            onChange={(evento) => {
              setCategoriaId(evento.target.value);
              setCargando(true);
            }}
            style={{
              width: "100%",
              padding: "14px",
              border: "2px solid #f5c542",
              borderRadius: "10px",
              background: "white",
              color: "#111827",
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
        </div>

        <h2
          style={{
            marginBottom: "28px",
            color: "#f5c542",
            textAlign: "center",
            fontSize: "clamp(30px, 4vw, 46px)",
          }}
        >
          {categoriaActual?.nombre || "Categoría"}
        </h2>

        {cargando && (
          <p
            style={{
              textAlign: "center",
              fontSize: "20px",
            }}
          >
            Cargando resultados...
          </p>
        )}

        {error && (
          <p
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: "#7f1d1d",
              color: "#fecaca",
              textAlign: "center",
              fontSize: "18px",
            }}
          >
            {error}
          </p>
        )}

        {!cargando &&
          !error &&
          resultados.length === 0 && (
            <p
              style={{
                textAlign: "center",
                fontSize: "20px",
              }}
            >
              No hay participantes en esta categoría.
            </p>
          )}

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {resultados.map((resultado, indice) => {
            const completo =
              Number(resultado.jurados_evaluados) === 5;

            const tienePuntaje =
              Number(resultado.jurados_evaluados) > 0;

            return (
              <article
                key={resultado.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "90px minmax(220px, 1fr) 180px 180px",
                  alignItems: "center",
                  gap: "20px",
                  padding: "22px",
                  overflow: "hidden",
                  borderRadius: "16px",
                  border:
                    indice === 0 && completo
                      ? "3px solid #f5c542"
                      : completo
                        ? "2px solid #22c55e"
                        : "1px solid #4b5563",
                  background:
                    indice === 0 && completo
                      ? "linear-gradient(90deg, #755608, #1f2937)"
                      : "#1f2937",
                  boxShadow:
                    indice === 0 && completo
                      ? "0 0 25px rgba(245, 197, 66, 0.25)"
                      : "none",
                }}
              >
                <div
                  style={{
                    color:
                      indice === 0 && completo
                        ? "#f5c542"
                        : "#d1d5db",
                    textAlign: "center",
                    fontSize: "36px",
                    fontWeight: "bold",
                  }}
                >
                  {completo ? `${indice + 1}°` : "—"}
                </div>

                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "clamp(23px, 3vw, 32px)",
                    }}
                  >
                    {resultado.nombre}
                  </h3>

                  <p
                    style={{
                      margin: "9px 0 0",
                      color: "#d1d5db",
                      fontSize: "17px",
                    }}
                  >
                    Jurados evaluados:{" "}
                    {resultado.jurados_evaluados} de 5
                  </p>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: "380px",
                      height: "9px",
                      marginTop: "10px",
                      overflow: "hidden",
                      borderRadius: "999px",
                      background: "#4b5563",
                    }}
                  >
                    <div
                      style={{
                        width: `${
                          (Number(
                            resultado.jurados_evaluados
                          ) /
                            5) *
                          100
                        }%`,
                        height: "100%",
                        background: completo
                          ? "#22c55e"
                          : "#f5c542",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: "12px",
    gridColumn: "3 / span 2",
  }}
>
  {[
  { nombre: "J1", valor: resultado.jurado_1 },
  { nombre: "J2", valor: resultado.jurado_2 },
  { nombre: "J3", valor: resultado.jurado_3 },

  { nombre: "🔒", valor: null },
  { nombre: "🔒", valor: null },

].map((j) => (
    <div
      key={j.nombre}
      style={{
        background: "#111827",
        border: "2px solid #f5c542",
        borderRadius: "12px",
        padding: "12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#f5c542",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        {j.nombre}
      </div>

      <div
        style={{
          marginTop: "8px",
          fontSize: "32px",
          fontWeight: "bold",
          color: "white",
        }}
      >
        {j.valor === null ? "RESERVADO" : j.valor}
      </div>
    </div>
  ))}
</div>
                {completo && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      marginTop: "5px",
                      paddingTop: "18px",
                      borderTop: "1px solid #6b7280",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#d1d5db",
                        fontSize: "18px",
                      }}
                    >
                      TOTAL PARCIAL
                    </p>

                    <strong
  style={{
    display: "block",
    marginTop: "7px",
    color: "#f5c542",
    fontSize: "52px",
  }}
>
  {Number(resultado.jurado_1 || 0) +
 Number(resultado.jurado_2 || 0) +
 Number(resultado.jurado_3 || 0)}
</strong>

                    {indice === 0 && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#f5c542",
                          fontSize: "21px",
                          fontWeight: "bold",
                        }}
                      >
                        🥇 Primer lugar provisional
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
            </div>

      <style>{`
        @media (max-width: 850px) {
          article {
            grid-template-columns: 70px 1fr !important;
          }

          article > div:nth-of-type(3),
          article > div:nth-of-type(4) {
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}