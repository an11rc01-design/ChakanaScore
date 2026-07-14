import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";

export default function ResultadosAdmin() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
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
        setError(errorCarga.message);
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
          `${API_URL}/detalle-resultados/${categoriaId}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los resultados.");
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

    setCargando(true);
    cargarResultados();

    const intervalo = setInterval(cargarResultados, 3000);

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
        padding: "35px 20px",
        boxSizing: "border-box",
        background: "#111827",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
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
            fontSize: "42px",
            marginBottom: "8px",
          }}
        >
          Resultados detallados
        </h1>

        <p style={{ color: "#d1d5db", fontSize: "18px" }}>
          Puntajes emitidos por cada jurado
        </p>

        <section
          style={{
            marginTop: "25px",
            marginBottom: "28px",
            padding: "20px",
            background: "#1f2937",
            borderRadius: "14px",
          }}
        >
          <label
            htmlFor="categoria-resultados"
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "18px",
            }}
          >
            Categoría
          </label>

          <select
            id="categoria-resultados"
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
              fontSize: "19px",
            }}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
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

        {cargando && <p>Cargando resultados...</p>}

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

        {!cargando && !error && (
          <div
            style={{
              overflowX: "auto",
              marginTop: "25px",
              borderRadius: "14px",
              border: "1px solid #4b5563",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "1000px",
                borderCollapse: "collapse",
                background: "#1f2937",
              }}
            >
              <thead>
                <tr style={{ background: "#312e18" }}>
                  <th style={estiloEncabezado}>Lugar</th>
                  <th style={estiloEncabezado}>Competidor</th>
                  <th style={estiloEncabezado}>Jurado 1</th>
                  <th style={estiloEncabezado}>Jurado 2</th>
                  <th style={estiloEncabezado}>Jurado 3</th>
                  <th style={estiloEncabezado}>Jurado 4</th>
                  <th style={estiloEncabezado}>
                    Jurado 5
                    <div
                      style={{
                        color: "#f5c542",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      Incógnito
                    </div>
                  </th>
                  <th style={estiloEncabezado}>Evaluados</th>
                  <th style={estiloEncabezado}>Total</th>
                </tr>
              </thead>

              <tbody>
                {resultados.map((resultado, indice) => {
                  const completo =
                    Number(resultado.jurados_evaluados) === 5;

                  return (
                    <tr
                      key={resultado.participante_id}
                      style={{
                        background:
                          indice === 0 && completo
                            ? "#4c3a0a"
                            : "#1f2937",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      <td style={estiloCelda}>
                        {completo ? `${indice + 1}°` : "—"}
                      </td>

                      <td
                        style={{
                          ...estiloCelda,
                          textAlign: "left",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        {resultado.participante}
                      </td>

                      <td style={estiloCelda}>
                        {resultado.jurado_1 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_2 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_3 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_4 ?? "—"}
                      </td>
                      <td
                        style={{
                          ...estiloCelda,
                          color: "#f5c542",
                          fontWeight: "bold",
                        }}
                      >
                        {resultado.jurado_5 ?? "?"}
                      </td>

                      <td style={estiloCelda}>
                        {resultado.jurados_evaluados} / 5
                      </td>

                      <td
                        style={{
                          ...estiloCelda,
                          color: completo ? "#f5c542" : "#d1d5db",
                          fontWeight: "bold",
                          fontSize: "22px",
                        }}
                      >
                        {completo ? resultado.total_general : "Pendiente"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const estiloEncabezado = {
  padding: "16px 12px",
  borderBottom: "2px solid #f5c542",
  color: "#f5c542",
  textAlign: "center",
  fontSize: "16px",
};

const estiloCelda = {
  padding: "15px 12px",
  textAlign: "center",
  color: "white",
};