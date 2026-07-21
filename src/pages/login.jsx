import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import flyerChakana from "../assets/flyer-chakana.jpeg";

const API_URL = "https://chakanascore.onrender.com";

export default function Login() {
  const navigate = useNavigate();

  const [jurados, setJurados] = useState([]);
  const [juradoSeleccionado, setJuradoSeleccionado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarJurados() {
      try {
        const respuesta = await fetch(`${API_URL}/jurados`);

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los jurados.");
        }

        const datos = await respuesta.json();
        setJurados(datos);
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      } finally {
        setCargando(false);
      }
    }

    cargarJurados();
  }, []);

  function ingresar() {
    if (!juradoSeleccionado) {
      alert("Seleccione un jurado.");
      return;
    }

    const jurado = jurados.find(
      (item) => item.id === Number(juradoSeleccionado)
    );

    localStorage.setItem("jurado", juradoSeleccionado);
    localStorage.setItem(
      "nombreJurado",
      jurado?.nombre || "Jurado"
    );

    navigate("/panel");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "grid",
        placeItems: "center",
        padding: "30px 20px",
        boxSizing: "border-box",
        overflow: "hidden",
        background: "#080604",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${flyerChakana})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
          transform: "scale(1.04)",
          opacity: 0.42,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.9))",
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "560px",
          padding: "34px",
          boxSizing: "border-box",
          textAlign: "center",
          color: "white",
          background: "rgba(15, 10, 6, 0.9)",
          border: "1px solid rgba(220, 168, 88, 0.55)",
          borderRadius: "24px",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(12px)",
        }}
      >
        <img
  src="/logo-wiracocha.png"
  alt="Producciones Wiracocha"
  style={{
    width: "150px",
    height: "150px",
    objectFit: "contain",
    borderRadius: "50%",
    marginBottom: "10px",
  }}
/>

        <p
          style={{
            margin: "5px 0",
            color: "#d6a354",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "5px",
          }}
        >
          PRODUCCIONES WIRACOCHA
        </p>

        <h1
          style={{
            margin: "12px 0 0",
            color: "#f0c476",
            fontSize: "clamp(34px, 7vw, 52px)",
            lineHeight: 1,
            textShadow: "0 3px 12px rgba(0,0,0,0.7)",
          }}
        >
          WiracochaScore
        </h1>

        <h2
          style={{
            margin: "14px 0 4px",
            color: "white",
            fontSize: "24px",
          }}
        >
          La Chakana Sagrada
        </h2>

        <p
          style={{
            margin: "0 0 26px",
            color: "#d1d5db",
          }}
        >
          Sistema oficial de evaluación
        </p>

        <label
          htmlFor="jurado"
          style={{
            display: "block",
            marginBottom: "9px",
            textAlign: "left",
            color: "#f0c476",
            fontWeight: "bold",
          }}
        >
          Seleccione su jurado
        </label>

        <select
          id="jurado"
          value={juradoSeleccionado}
          onChange={(evento) =>
            setJuradoSeleccionado(evento.target.value)
          }
          disabled={cargando}
          style={{
            width: "100%",
            padding: "15px",
            boxSizing: "border-box",
            border: "1px solid #b98643",
            borderRadius: "10px",
            fontSize: "18px",
            background: "#fffaf2",
          }}
        >
          <option value="">
            {cargando ? "Cargando jurados..." : "Seleccione..."}
          </option>

          {jurados.map((jurado) => (
  <option key={jurado.id} value={jurado.id}>
    {jurado.id === 4
      ? "🔒 Jurado Incógnito 4"
      : jurado.id === 5
      ? "🔒 Jurado Incógnito 5"
      : jurado.nombre}
  </option>
))}
        </select>

        {error && (
          <p
            style={{
              marginTop: "14px",
              padding: "12px",
              color: "#fecaca",
              background: "#7f1d1d",
              borderRadius: "9px",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={ingresar}
          disabled={
            cargando ||
            !juradoSeleccionado ||
            jurados.length === 0
          }
          style={{
            width: "100%",
            marginTop: "22px",
            padding: "16px",
            border: "none",
            borderRadius: "11px",
            color: "#17100a",
            background:
              "linear-gradient(135deg, #d49a48, #f0c476, #b77b31)",
            fontSize: "19px",
            fontWeight: "bold",
            cursor: juradoSeleccionado
              ? "pointer"
              : "not-allowed",
            boxShadow: "0 10px 30px rgba(212, 154, 72, 0.25)",
          }}
        >
          Ingresar al sistema
        </button>
      </section>
    </main>
  );
}