import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [jurados, setJurados] = useState([]);
  const [juradoSeleccionado, setJuradoSeleccionado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function cargarJurados() {
      try {
        const respuesta = await fetch("http://localhost:3001/jurados");

        if (!respuesta.ok) {
          throw new Error("El servidor no respondió correctamente");
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error("La respuesta de jurados no es válida");
        }

        setJurados(datos);
      } catch (errorCarga) {
        console.error(errorCarga);
        setError("No se pudieron cargar los jurados.");
      } finally {
        setCargando(false);
      }
    }

    cargarJurados();
  }, []);

  function ingresar() {
    if (!juradoSeleccionado) {
      alert("Seleccione un jurado");
      return;
    }

    const juradoEncontrado = jurados.find(
      (jurado) => jurado.id === Number(juradoSeleccionado)
    );

    if (!juradoEncontrado) {
      alert("El jurado seleccionado no es válido");
      return;
    }

    localStorage.setItem("jurado", String(juradoEncontrado.id));
    localStorage.setItem("nombreJurado", juradoEncontrado.nombre);

    navigate("/panel");
  }

  return (
    <div
      style={{
        width: "min(500px, 90%)",
        margin: "80px auto",
        textAlign: "center",
      }}
    >
      <h1>🏆 ChakanaScore</h1>
      <h2>Seleccione su jurado</h2>

      {cargando ? (
        <p>Cargando jurados...</p>
      ) : (
        <select
          value={juradoSeleccionado}
          onChange={(evento) =>
            setJuradoSeleccionado(evento.target.value)
          }
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "20px",
          }}
        >
          <option value="">Seleccione...</option>

          {jurados.map((jurado) => (
            <option key={jurado.id} value={jurado.id}>
              {jurado.nombre}
              {jurado.visible === 0 ? " — Incógnito" : ""}
            </option>
          ))}
        </select>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>Jurados cargados: {jurados.length}</p>

      <button
        onClick={ingresar}
        disabled={cargando || jurados.length === 0}
        style={{
          padding: "15px 40px",
          fontSize: "20px",
          marginTop: "20px",
        }}
      >
        Ingresar
      </button>
    </div>
  );
}