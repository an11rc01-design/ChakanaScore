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

          top: 28.5%;
          left: 22.5%;

          width: 55%;
          height: 14%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          text-align: center;

          background:
            linear-gradient(
              180deg,
              rgba(5, 6, 8, 0.99),
              rgba(10, 10, 11, 0.99)
            );

          border: 2px solid rgba(214, 160, 28, 0.85);
          border-radius: 13px;

          box-shadow:
            0 10px 25px rgba(0, 0, 0, 0.8);
        }

        .bloque-categoria span {
          color: #eebc3e;

          font-size: clamp(
            14px,
            1.8vw,
            32px
          );

          font-weight: 900;
          line-height: 1;
        }

        .bloque-categoria strong {
          max-width: 96%;

          margin-top: 1.5%;

          color: #f8f1df;

          font-size: clamp(
            32px,
            5vw,
            85px
          );

          line-height: 0.95;
          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          text-shadow:
            0 5px 8px #000;
        }

        /* =========================
           COMPETIDOR
        ========================= */

        .bloque-competidor {
          position: absolute;

          top: 42.2%;
          left: 20.5%;

          width: 59%;
          height: 8.5%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          text-align: center;

          background:
            linear-gradient(
              180deg,
              rgba(8, 8, 8, 0.99),
              rgba(15, 13, 8, 0.99)
            );

          border: 2px solid #c8951e;
          border-radius: 12px;

          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.85);
        }

        .bloque-competidor span {
          color: #eebc3e;

          font-size: clamp(
            11px,
            1.25vw,
            23px
          );

          font-weight: 900;
          line-height: 1;
        }

        .bloque-competidor strong {
          width: 96%;

          margin-top: 0.5%;

          color: white;

          font-size: clamp(
            18px,
            2.5vw,
            44px
          );

          line-height: 1;
          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          text-shadow:
            0 4px 7px #000;
        }

        /* =========================
           JURADOS
        ========================= */

        .contenedor-jurados {
          position: absolute;

          top: 52%;
          left: 4.2%;

          width: 91.6%;
          height: 26.5%;

          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));

          gap: 1.25%;
        }

        .tarjeta {
          min-width: 0;
          height: 100%;

          overflow: hidden;

          background:
            linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.99),
              rgba(3, 3, 3, 0.99)
            );

          border: 3px solid var(--color);
          border-radius: 14px;

          box-shadow:
            0 0 14px var(--color),
            0 12px 25px rgba(0, 0, 0, 0.85);
        }

        .encabezado-jurado {
          height: 20%;

          display: grid;
          place-items: center;

          color: white;

          background:
            linear-gradient(
              180deg,
              var(--fondo),
              rgba(0, 0, 0, 0.45)
            );

          border-bottom:
            1px solid var(--color);

          font-size: clamp(
            11px,
            1.45vw,
            27px
          );

          font-weight: 900;
          text-align: center;
        }

        .contenido-jurado {
          height: 80%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background:
            linear-gradient(
              180deg,
              rgba(2, 2, 2, 0.99),
              rgba(0, 0, 0, 0.99)
            );
        }

        .numero {
          color: #f8efdb;

          font-size: clamp(
            55px,
            7.3vw,
            132px
          );

          line-height: 1;

          text-shadow:
            0 6px 6px #000,
            0 0 18px rgba(255, 213, 120, 0.35);
        }

        .candado {
          font-size: clamp(
            43px,
            5vw,
            90px
          );

          line-height: 1;

          filter:
            grayscale(1)
            brightness(1.45);
        }

        .texto-incognito {
          margin-top: 6%;

          color: #e2e2e2;

          font-size: clamp(
            10px,
            1.25vw,
            22px
          );

          font-weight: 900;
        }

        /* =========================
           TOTAL
        ========================= */

        .bloque-total {
          position: absolute;

          top: 81%;
          left: 26.5%;

          width: 47%;
          height: 15%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          text-align: center;

          background:
            linear-gradient(
              180deg,
              rgba(5, 5, 5, 0.99),
              rgba(13, 10, 5, 0.99)
            );

          border: 3px solid #c8951e;
          border-radius: 14px;

          box-shadow:
            0 0 25px rgba(230, 171, 30, 0.4),
            0 15px 30px rgba(0, 0, 0, 0.85);
        }

        .bloque-total span {
          color: #eebc3e;

          font-size: clamp(
            16px,
            2vw,
            37px
          );

          font-weight: 900;
          line-height: 1;
        }

        .bloque-total strong {
          color: #f8efdb;

          font-size: clamp(
            58px,
            7.7vw,
            138px
          );

          line-height: 0.9;

          text-shadow:
            0 6px 7px #000,
            0 0 20px rgba(255, 201, 90, 0.3);
        }

        /* Pantallas más cuadradas */

        @media (max-aspect-ratio: 4 / 3) {
          .bloque-categoria strong {
            font-size: clamp(
              27px,
              5vw,
              60px
            );
          }

          .bloque-competidor strong {
            font-size: clamp(
              17px,
              2.8vw,
              34px
            );
          }

          .encabezado-jurado {
            font-size: clamp(
              9px,
              1.5vw,
              18px
            );
          }

          .texto-incognito {
            font-size: clamp(
              9px,
              1.3vw,
              16px
            );
          }
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