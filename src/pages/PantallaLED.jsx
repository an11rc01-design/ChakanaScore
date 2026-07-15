import { useEffect, useMemo, useState } from "react";

const API_URL = "https://chakanascore.onrender.com";

export default function PantallaLED() {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarResultado() {
      try {
        const respuesta = await fetch(
          `${API_URL}/ultimo-publicado?t=${Date.now()}`,
          { cache: "no-store" }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el competidor.");
        }

        const datos = await respuesta.json();

        setResultado(datos || null);
        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      }
    }

    cargarResultado();

    const intervalo = setInterval(cargarResultado, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const totalParcial = useMemo(() => {
    if (!resultado) return 0;

    return (
      Number(resultado.jurado_1 || 0) +
      Number(resultado.jurado_2 || 0) +
      Number(resultado.jurado_3 || 0)
    );
  }, [resultado]);

  if (error) {
    return <PantallaEspera texto={`Error: ${error}`} />;
  }

  if (!resultado) {
    return <PantallaEspera texto="Esperando competidor..." />;
  }

  const jurados = [
    {
      nombre: "JURADO 1",
      valor: resultado.jurado_1,
      color: "#0787ff",
      fondo: "#05234b",
    },
    {
      nombre: "JURADO 2",
      valor: resultado.jurado_2,
      color: "#55d719",
      fondo: "#174d08",
    },
    {
      nombre: "JURADO 3",
      valor: resultado.jurado_3,
      color: "#ffd000",
      fondo: "#6b5200",
    },
    {
      nombre: "JURADO 4",
      reservado: true,
      color: "#a629e8",
      fondo: "#45105f",
    },
    {
      nombre: "JURADO 5",
      reservado: true,
      color: "#ff2027",
      fondo: "#681014",
    },
  ];

  return (
    <main className="pantalla">
      <section className="lienzo">
        {/* Cubre la categoría impresa en la imagen */}
        <div className="bloque-categoria">
          <span>CATEGORÍA</span>

          <strong>
            {resultado.categoria || "CATEGORÍA"}
          </strong>
        </div>

        {/* Cubre el competidor impreso en la imagen */}
        <div className="bloque-competidor">
          <span>COMPETIDOR ACTUAL</span>

          <strong>
            {resultado.nombre || "COMPETIDOR"}
          </strong>
        </div>

        {/* Cubre completamente las tarjetas impresas */}
        <section className="contenedor-jurados">
          {jurados.map((jurado) => (
            <article
              key={jurado.nombre}
              className="tarjeta"
              style={{
                "--color": jurado.color,
                "--fondo": jurado.fondo,
              }}
            >
              <div className="encabezado-jurado">
                {jurado.nombre}
              </div>

              <div className="contenido-jurado">
                {jurado.reservado ? (
                  <>
                    <div className="candado">
                      🔒
                    </div>

                    <span className="texto-incognito">
                      INCÓGNITO
                    </span>
                  </>
                ) : (
                  <strong className="numero">
                    {jurado.valor ?? "—"}
                  </strong>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Cubre el total impreso en la imagen */}
        <section className="bloque-total">
          <span>TOTAL PARCIAL</span>

          <strong>{totalParcial}</strong>
        </section>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
          background: #000;
        }

        .pantalla {
          width: 100vw;
          height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #000;
          font-family: Arial, Helvetica, sans-serif;
        }

        /*
          La imagen mide 1536 x 1024.
          Su proporción es 3:2.
        */
        .lienzo {
          position: relative;

          width: min(100vw, 150vh);
          height: min(100vh, 66.6667vw);

          overflow: hidden;

          background-image: url("/scoreboard.png");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;

          box-shadow: 0 0 50px rgba(0, 0, 0, 0.9);

          animation: aparecer 0.5s ease;
        }

        @keyframes aparecer {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        /* =========================
           CATEGORÍA
        ========================= */

        .bloque-categoria {
  position: absolute;
  top: 31%;
  left: 25%;
  width: 50%;
  height: 10.5%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  text-align: center;
  background: #070707;
  border: 2px solid #c8951e;
  border-radius: 12px;
  overflow: hidden;
}

.bloque-categoria span {
  color: #eebc3e;
  font-size: clamp(14px, 1.5vw, 27px);
  font-weight: 900;
  line-height: 1;
}

.bloque-categoria strong {
  width: 96%;
  margin-top: 5px;
  color: #f8f1df;
  font-size: clamp(27px, 3.7vw, 63px);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

        /* =========================
           COMPETIDOR
        ========================= */

        .bloque-competidor {
  position: absolute;
  top: 42.5%;
  left: 23%;
  width: 54%;
  height: 7.5%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  text-align: center;
  background: #070707;
  border: 2px solid #c8951e;
  border-radius: 11px;
  overflow: hidden;
}

.bloque-competidor span {
  color: #eebc3e;
  font-size: clamp(10px, 1.05vw, 19px);
  font-weight: 900;
  line-height: 1;
}

.bloque-competidor strong {
  width: 96%;
  margin-top: 4px;
  color: white;
  font-size: clamp(18px, 2.15vw, 36px);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

        /* =========================
           JURADOS
        ========================= */

        .contenedor-jurados {
  position: absolute;
  top: 52.8%;
  left: 4%;
  width: 92%;
  height: 25%;

  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1.2%;
}

        /* =========================
           TOTAL
        ========================= */

        .bloque-total {
  position: absolute;
  top: 79.5%;
  left: 29%;
  width: 42%;
  height: 14%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  text-align: center;
  background: #060504;
  border: 3px solid #c8951e;
  border-radius: 14px;
  overflow: hidden;
}

.bloque-total span {
  color: #eebc3e;
  font-size: clamp(15px, 1.65vw, 30px);
  font-weight: 900;
  line-height: 1;
}

.bloque-total strong {
  margin-top: 4px;
  color: #f8efdb;
  font-size: clamp(48px, 6vw, 105px);
  line-height: 0.88;
}
      `}</style>
    </main>
  );
}

function PantallaEspera({ texto }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",

        display: "grid",
        placeItems: "center",

        color: "#e4b04d",

        background:
          "radial-gradient(circle at center, #231608, #000 70%)",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        fontSize:
          "clamp(30px, 5vw, 75px)",

        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {texto}
    </div>
  );
}