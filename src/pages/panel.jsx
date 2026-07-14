import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Panel() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const nombreJurado =
    localStorage.getItem("nombreJurado") || "Jurado no identificado";

  useEffect(() => {
    fetch("http://localhost:3001/categorias")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las categorías.");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setCategorias(datos);
      })
      .catch((errorCarga) => {
        console.error(errorCarga);
        setError("No se pudo conectar con el servidor.");
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  function cerrarSesion() {
    localStorage.removeItem("jurado");
    localStorage.removeItem("nombreJurado");
    navigate("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#111827",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
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
            <h1
              style={{
                margin: 0,
                color: "#f5c542",
                fontSize: "42px",
              }}
            >
              🏆 Panel del Jurado
            </h1>

            <h2
              style={{
                marginTop: "10px",
                fontWeight: "normal",
              }}
            >
              👨‍⚖️ {nombreJurado}
            </h2>
          </div>

          <button
            onClick={cerrarSesion}
            style={{
              background: "#374151",
              color: "white",
              border: "1px solid #6b7280",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>

        <h2 style={{ marginBottom: "20px" }}>
          Seleccione una categoría
        </h2>

        {cargando && <p>Cargando categorías...</p>}

        {error && (
          <p
            style={{
              color: "#fca5a5",
              background: "#7f1d1d",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() =>
                navigate(`/competencia/${categoria.id}`)
              }
              style={{
                minHeight: "110px",
                padding: "20px",
                background: "#1f2937",
                color: "white",
                border: "2px solid #f5c542",
                borderRadius: "14px",
                fontSize: "22px",
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}