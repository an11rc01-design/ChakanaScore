import { useEffect, useMemo, useState } from "react";

const API_URL = "https://chakanascore.onrender.com";

export default function PantallaLED() {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCompetidor() {
      try {
        const respuesta = await fetch(
          `${API_URL}/ultimo-publicado?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el competidor publicado.");
        }

        const datos = await respuesta.json();

        setResultado(datos || null);
        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      }
    }

    cargarCompetidor();

    const intervalo = setInterval(cargarCompetidor, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const totalParcial = useMemo(() => {
    if (!resultado) {
      return 0;
    }

    return (
      Number(resultado.jurado_1 || 0) +
      Number(resultado.jurado_2 || 0) +
      Number(resultado.jurado_3 || 0)
    );
  }, [resultado]);

  if (error) {
    return (
      <PantallaEspera texto={`Error: ${error}`} />
    );
  }

  if (!resultado) {
    return (
      <PantallaEspera texto="Esperando competidor..." />
    );
  }

  const jurados = [
    {
      nombre: "JURADO 1",
      valor: resultado.jurado_1,
      color: "#1587ff",
    },
    {
      nombre: "JURADO 2",
      valor: resultado.jurado_2,
      color: "#55a91e",
    },
    {
      nombre: "JURADO 3",
      valor: resultado.jurado_3,
      color: "#e6b500",
    },
    {
      nombre: "JURADO 4",
      reservado: true,
      color: "#8b28c7",
    },
    {
      nombre: "JURADO 5",
      reservado: true,
      color: "#d71920",
    },
  ];

  return (
    <main className="pantalla-led">
      <section className="lienzo">
        <div className="contenido-dinamico">
          <div className="categoria">
            <span>CATEGORÍA</span>

            <strong>
              {resultado.categoria || "CATEGORÍA"}
            </strong>
          </div>

          <div className="competidor">
            <span>COMPETIDOR ACTUAL</span>

            <strong>
              {resultado.nombre || "COMPETIDOR"}
            </strong>
          </div>

          <div className="jurados">
            {jurados.map((jurado) => (
              <article
                key={jurado.nombre}
                className="tarjeta-jurado"
                style={{
                  "--color-jurado": jurado.color,
                }}
              >
                <div className="nombre-jurado">
                  {jurado.nombre}
                </div>

                <div className="puntaje-jurado">
                  {jurado.reservado ? (
                    <>
                      <div className="candado">🔒</div>

                      <div className="incognito">
                        INCÓGNITO
                      </div>
                    </>
                  ) : (
                    <strong>
                      {jurado.valor ?? "—"}
                    </strong>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="total">
            <span>TOTAL PARCIAL</span>

            <strong>{totalParcial}</strong>
          </div>
        </div>
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

        .pantalla-led {
          width: 100vw;
          height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #000;
          font-family: Arial, Helvetica, sans-serif;
        }

        /*
          La imagen scoreboard.png mide aproximadamente 3:2.
          El lienzo mantiene esa proporción para que no se corte.
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
        }

        .contenido-dinamico {
          position: absolute;
          inset: 0;
          animation: entrada 0.6s ease;
        }

        @keyframes entrada {
          from {
            opacity: 0;
            transform: scale(0.99);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /*
          Estas capas oscuras cubren los textos y números
          que vienen impresos en la imagen de ejemplo.
        */
        .categoria {
          position: absolute;
          top: 23.5%;
          left: 27%;
          width: 46%;
          height: 14%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          background: rgba(13, 9, 5, 0.96);
          border-radius: 10px;
        }

        .categoria span {
          color: #e2b946;
          font-size: clamp(16px, 1.8vw, 34px);
          font-weight: 900;
          line-height: 1;
        }

        .categoria strong {
          margin-top: 1%;
          color: #f5ead1;
          font-size: clamp(34px, 4.7vw, 88px);
          line-height: 0.95;
          text-transform: uppercase;
          text-shadow: 0 4px 10px #000;
        }

        .competidor {
          position: absolute;
          top: 38.5%;
          left: 23%;
          width: 54%;
          height: 9%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          background:
            linear-gradient(
              90deg,
              rgba(13, 9, 5, 0.98),
              rgba(25, 14, 8, 0.98),
              rgba(13, 9, 5, 0.98)
            );
          border: 2px solid #b88724;
          border-radius: 10px;
        }

        .competidor span {
          color: #e2b946;
          font-size: clamp(11px, 1.1vw, 21px);
          font-weight: 900;
        }

        .competidor strong {
          max-width: 96%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #fff;
          font-size: clamp(20px, 2.3vw, 43px);
          line-height: 1;
          text-transform: uppercase;
        }

        .jurados {
          position: absolute;
          top: 48.2%;
          left: 4%;
          width: 92%;
          height: 27%;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.2%;
        }

        .tarjeta-jurado {
          min-width: 0;
          overflow: hidden;
          border: 3px solid var(--color-jurado);
          border-radius: 12px;
          background: rgba(1, 1, 1, 0.97);
          box-shadow:
            0 0 15px color-mix(
              in srgb,
              var(--color-jurado) 45%,
              transparent
            );
        }

        .nombre-jurado {
          height: 21%;
          display: grid;
          place-items: center;
          color: #f6efd9;
          background:
            linear-gradient(
              180deg,
              color-mix(
                in srgb,
                var(--color-jurado) 65%,
                #000
              ),
              color-mix(
                in srgb,
                var(--color-jurado) 35%,
                #000
              )
            );
          border-bottom: 1px solid var(--color-jurado);
          font-size: clamp(12px, 1.35vw, 26px);
          font-weight: 900;
          text-align: center;
        }

        .puntaje-jurado {
          height: 79%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .puntaje-jurado strong {
          color: #f8efd9;
          font-size: clamp(54px, 7.4vw, 138px);
          line-height: 1;
          text-shadow:
            0 4px 4px #000,
            0 0 20px rgba(255, 210, 110, 0.25);
        }

        .candado {
          font-size: clamp(42px, 5vw, 94px);
          line-height: 1;
          filter: grayscale(1);
        }

        .incognito {
          margin-top: 4%;
          color: #c8c8c8;
          font-size: clamp(11px, 1.25vw, 24px);
          font-weight: 900;
        }

        .total {
          position: absolute;
          top: 76%;
          left: 27%;
          width: 46%;
          height: 16%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          background:
            linear-gradient(
              180deg,
              rgba(8, 6, 3, 0.98),
              rgba(20, 13, 5, 0.98)
            );
          border: 3px solid #b88724;
          border-radius: 12px;
          box-shadow:
            0 0 25px rgba(255, 174, 0, 0.35);
        }

        .total span {
          color: #e3b94a;
          font-size: clamp(18px, 2.2vw, 42px);
          font-weight: 900;
          line-height: 1;
        }

        .total strong {
          color: #f6ead0;
          font-size: clamp(65px, 8vw, 150px);
          line-height: 0.9;
          text-shadow:
            0 4px 5px #000,
            0 0 18px rgba(255, 199, 80, 0.3);
        }

        @media (max-aspect-ratio: 4 / 3) {
          .categoria strong {
            font-size: clamp(27px, 5vw, 60px);
          }

          .competidor strong {
            font-size: clamp(17px, 2.8vw, 34px);
          }

          .nombre-jurado {
            font-size: clamp(9px, 1.5vw, 18px);
          }

          .incognito {
            font-size: clamp(9px, 1.3vw, 16px);
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
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "clamp(30px, 5vw, 75px)",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {texto}
    </div>
  );
}