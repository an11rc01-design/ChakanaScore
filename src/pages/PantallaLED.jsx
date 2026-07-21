import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_URL = "https://chakanascore.onrender.com";

export default function PantallaLED() {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [fase, setFase] = useState("espera");
  const [cuenta, setCuenta] = useState(3);

  const ultimoParticipanteId = useRef(null);
  const primeraCarga = useRef(true);
  const temporizadores = useRef([]);

  function limpiarTemporizadores() {
    temporizadores.current.forEach((temporizador) =>
      clearTimeout(temporizador)
    );

    temporizadores.current = [];
  }

  function iniciarConteo() {
    limpiarTemporizadores();

    setFase("conteo");
    setCuenta(3);

    temporizadores.current.push(
      setTimeout(() => {
        setCuenta(2);
      }, 1000)
    );

    temporizadores.current.push(
      setTimeout(() => {
        setCuenta(1);
      }, 2000)
    );

    temporizadores.current.push(
      setTimeout(() => {
        setFase("resultado");
      }, 3000)
    );
  }

  useEffect(() => {
    async function cargarResultado() {
      try {
        const respuesta = await fetch(
          `${API_URL}/ultimo-publicado?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!respuesta.ok) {
          throw new Error(
            "No se pudo cargar el competidor."
          );
        }

        const datos = await respuesta.json();

        if (!datos || !datos.id) {
          setResultado(null);
          setFase("espera");
          setError("");
          return;
        }

        const nuevoId = Number(datos.id);

        if (primeraCarga.current) {
          primeraCarga.current = false;
          ultimoParticipanteId.current = nuevoId;

          setResultado(datos);
          setFase("resultado");
          setError("");

          return;
        }

        if (
          nuevoId !==
          Number(ultimoParticipanteId.current)
        ) {
          ultimoParticipanteId.current = nuevoId;
          setResultado(datos);
          iniciarConteo();
        } else {
          setResultado(datos);
        }

        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      }
    }

    cargarResultado();

    const intervalo = setInterval(
      cargarResultado,
      1000
    );

    return () => {
      clearInterval(intervalo);
      limpiarTemporizadores();
    };
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

  if (!resultado || fase === "espera") {
    return (
      <PantallaEspera texto="Esperando competidor..." />
    );
  }

  if (fase === "conteo") {
    return <PantallaConteo numero={cuenta} />;
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
      nombre: "JURADO INCÓGNITO 4",
      reservado: true,
      color: "#a629e8",
      fondo: "#45105f",
    },
    {
      nombre: "JURADO INCÓGNITO 5",
      reservado: true,
      color: "#ff2027",
      fondo: "#681014",
    },
  ];

  return (
    <main className="pantalla">
      <section
        key={resultado.id}
        className="lienzo"
      >
        <div className="destello-resultado" />

        <div className="bloque-categoria">
          <span>CATEGORÍA</span>

          <strong>
            {resultado.categoria || "CATEGORÍA"}
          </strong>
        </div>

        <div className="bloque-competidor">
          <span>COMPETIDOR ACTUAL</span>

          <strong>
            {resultado.nombre || "COMPETIDOR"}
          </strong>
        </div>

        <section className="contenedor-jurados">
          {jurados.map((jurado, indice) => (
            <article
              key={jurado.nombre}
              className="tarjeta"
              style={{
                "--color": jurado.color,
                "--fondo": jurado.fondo,
                "--retraso": `${0.25 + indice * 0.16}s`,
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

          animation:
            aparecerResultado 0.8s ease both,
            zoomResultado 0.8s ease both;
        }

        .destello-resultado {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;

          background:
            radial-gradient(
              circle at center,
              rgba(255, 220, 110, 0.95),
              rgba(255, 177, 0, 0.4) 22%,
              transparent 62%
            );

          animation: destello 0.9s ease forwards;
        }

        @keyframes aparecerResultado {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes zoomResultado {
          from {
            transform: scale(1.08);
          }

          to {
            transform: scale(1);
          }
        }

        @keyframes destello {
          0% {
            opacity: 1;
          }

          45% {
            opacity: 0.55;
          }

          100% {
            opacity: 0;
          }
        }

        .bloque-categoria {
          position: absolute;
          top: 29.5%;
          left: 22%;
          width: 56%;
          height: 13%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background: #050505;
          border: 2px solid #c8951e;
          border-radius: 12px;
          overflow: hidden;
          z-index: 5;
        }

        .bloque-categoria span {
          color: #eebc3e;
          font-size: clamp(14px, 1.45vw, 26px);
          font-weight: 900;
          line-height: 1;
        }

        .bloque-categoria strong {
          width: 95%;
          margin-top: 7px;

          color: #f8f1df;
          font-size: clamp(28px, 3.8vw, 62px);
          line-height: 1;
          text-align: center;
          text-transform: uppercase;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bloque-competidor {
          position: absolute;
          top: 42.8%;
          left: 21%;
          width: 58%;
          height: 8%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background: #050505;
          border: 2px solid #c8951e;
          border-radius: 11px;
          overflow: hidden;
          z-index: 6;
        }

        .bloque-competidor span {
          color: #eebc3e;
          font-size: clamp(10px, 1vw, 18px);
          font-weight: 900;
          line-height: 1;
        }

        .bloque-competidor strong {
          width: 95%;
          margin-top: 5px;

          color: white;
          font-size: clamp(17px, 2.1vw, 35px);
          line-height: 1;
          text-align: center;
          text-transform: uppercase;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .contenedor-jurados {
          position: absolute;
          top: 52%;
          left: 3.8%;
          width: 92.4%;
          height: 25%;

          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 1.2%;

          z-index: 10;
        }

        .tarjeta {
          width: 100%;
          height: 100%;
          min-width: 0;

          overflow: hidden;
          background: #000;

          border: 3px solid var(--color);
          border-radius: 13px;

          box-shadow:
            0 0 12px var(--color),
            0 10px 25px rgba(0, 0, 0, 0.9);

          opacity: 0;
          transform: translateY(45px) scale(0.9);

          animation:
            entradaTarjeta 0.65s
            cubic-bezier(0.2, 0.9, 0.2, 1.2)
            var(--retraso) forwards;
        }

        @keyframes entradaTarjeta {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .encabezado-jurado {
          width: 100%;
          height: 20%;

          display: grid;
          place-items: center;

          background: var(--fondo);
          border-bottom: 1px solid var(--color);

          color: white;
          font-size: clamp(10px, 1.05vw, 19px);
          font-weight: 900;
          text-align: center;
        }

        .contenido-jurado {
          width: 100%;
          height: 80%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background: #000;
        }

        .numero {
          color: #f8efdb;
          font-size: clamp(52px, 6.8vw, 118px);
          line-height: 1;

          text-shadow:
            0 5px 6px #000,
            0 0 18px
              rgba(255, 211, 110, 0.3);
        }

        .candado {
          font-size: clamp(40px, 4.5vw, 78px);
          line-height: 1;
          filter: grayscale(1) brightness(1.5);
        }

        .texto-incognito {
          margin-top: 8px;

          color: #dedede;
          font-size: clamp(9px, 1.1vw, 19px);
          font-weight: 900;
        }

        .bloque-total {
          position: absolute;
          top: 79.5%;
          left: 27%;
          width: 46%;
          height: 14%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background: #050403;
          border: 3px solid #c8951e;
          border-radius: 14px;
          overflow: hidden;

          box-shadow:
            0 0 22px
              rgba(230, 171, 30, 0.35),
            0 12px 25px
              rgba(0, 0, 0, 0.9);

          z-index: 12;

          opacity: 0;
          transform: scale(0.65);

          animation:
            entradaTotal 0.8s
            cubic-bezier(0.2, 0.9, 0.2, 1.25)
            1.1s forwards;
        }

        @keyframes entradaTotal {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .bloque-total span {
          color: #eebc3e;
          font-size: clamp(15px, 1.6vw, 28px);
          font-weight: 900;
          line-height: 1;
        }

        .bloque-total strong {
          margin-top: 6px;

          color: #f8efdb;
          font-size: clamp(48px, 5.8vw, 100px);
          line-height: 0.85;

          text-shadow:
            0 5px 6px #000,
            0 0 18px
              rgba(255, 200, 80, 0.25);
        }
      `}</style>
    </main>
  );
}

function PantallaConteo({ numero }) {
  return (
    <main className="pantalla-conteo">
      <div className="particulas" />

      <p>PREPÁRATE PARA EL RESULTADO</p>

      <strong key={numero}>{numero}</strong>

      <span>LA CHAKANA SAGRADA 2026</span>

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

        .pantalla-conteo {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          color: white;
          text-align: center;
          font-family:
            Arial, Helvetica, sans-serif;

          background:
            radial-gradient(
              circle at center,
              #5d3906 0%,
              #201104 30%,
              #050302 65%,
              #000 100%
            );
        }

        .pantalla-conteo::before,
        .pantalla-conteo::after {
          content: "";
          position: absolute;
          width: 75vw;
          height: 75vw;
          max-width: 900px;
          max-height: 900px;

          border: 3px solid
            rgba(238, 188, 62, 0.18);

          transform: rotate(45deg);
          animation: girarChakana 9s linear infinite;
        }

        .pantalla-conteo::after {
          width: 48vw;
          height: 48vw;
          max-width: 580px;
          max-height: 580px;

          border-color:
            rgba(238, 188, 62, 0.3);

          animation-direction: reverse;
          animation-duration: 6s;
        }

        @keyframes girarChakana {
          from {
            transform: rotate(45deg);
          }

          to {
            transform: rotate(405deg);
          }
        }

        .pantalla-conteo p {
          position: relative;
          z-index: 5;

          margin: 0 0 15px;
          color: #eebc3e;

          font-size:
            clamp(18px, 2.5vw, 40px);

          font-weight: 900;
          letter-spacing: 5px;
        }

        .pantalla-conteo strong {
          position: relative;
          z-index: 5;

          color: #fff4ce;
          font-size:
            clamp(190px, 32vw, 520px);

          line-height: 0.85;

          text-shadow:
            0 0 12px #fff,
            0 0 35px #f6b80c,
            0 0 85px #f17300,
            0 15px 25px #000;

          animation:
            golpeNumero 0.95s
            cubic-bezier(0.15, 0.85, 0.25, 1)
            both;
        }

        @keyframes golpeNumero {
          0% {
            opacity: 0;
            transform: scale(2.2);
            filter: blur(18px);
          }

          35% {
            opacity: 1;
            transform: scale(0.88);
            filter: blur(0);
          }

          55% {
            transform: scale(1.06);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .pantalla-conteo span {
          position: relative;
          z-index: 5;

          margin-top: 35px;
          color: #eebc3e;

          font-size:
            clamp(17px, 2vw, 34px);

          font-weight: 900;
          letter-spacing: 7px;
        }

        .particulas {
          position: absolute;
          inset: -50%;

          background-image:
            radial-gradient(
              circle,
              rgba(255, 191, 0, 0.85) 0 2px,
              transparent 3px
            );

          background-size: 70px 70px;

          opacity: 0.25;

          animation:
            moverParticulas 5s linear infinite;
        }

        @keyframes moverParticulas {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-140px);
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