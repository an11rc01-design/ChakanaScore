import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "./pages/login";
import Panel from "./pages/panel";
import Competencia from "./pages/competencia";
import Evaluacion from "./pages/evaluacion";
import Publico from "./pages/publico";
import Administrador from "./pages/Administrador";
import GestionParticipantes from "./pages/GestionParticipantes";
import ResultadosAdmin from "./pages/ResultadosAdmin";
import ConfiguracionTorneo from "./pages/ConfiguracionTorneo";
import ReiniciarTorneo from "./pages/ReiniciarTorneo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
  path="/administrador/configuracion"
  element={<ConfiguracionTorneo />}
/>
        <Route path="/panel" element={<Panel />} />
        <Route
  path="/administrador/resultados"
  element={<ResultadosAdmin />}
/>
        <Route path="/publico" element={<Publico />} />
        <Route
  path="/administrador/participantes"
  element={<GestionParticipantes />}
/>
        <Route
  path="/administrador"
  element={<Administrador />}
/>
        <Route path="/competencia/:id" element={<Competencia />} />
        <Route
          path="/evaluacion/:participanteId"
          element={<Evaluacion />}
        />
        <Route
  path="/administrador/reiniciar"
  element={<ReiniciarTorneo />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
