import { useNavigate } from "react-router-dom";

function Inicio() {

    const navigate = useNavigate();

    return (

        <div className="app">

            <h1>🏆 ChakanaScore</h1>

            <h2>Sistema Profesional de Calificación</h2>

            <h3>La Chakana Sagrada 2026</h3>

            <button onClick={() => navigate("/panel")}>
                Iniciar Competencia
            </button>

        </div>

    );

}

export default Inicio;