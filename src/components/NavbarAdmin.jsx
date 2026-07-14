import { NavLink } from "react-router-dom";

const enlaces = [
  {
    ruta: "/administrador",
    texto: "Panel",
    icono: "🏠",
  },
  {
    ruta: "/administrador/participantes",
    texto: "Competidores",
    icono: "👥",
  },
  {
    ruta: "/administrador/resultados",
    texto: "Resultados",
    icono: "📊",
  },
  {
    ruta: "/administrador/configuracion",
    texto: "Configuración",
    icono: "⚙️",
  },
  {
    ruta: "/administrador/reiniciar",
    texto: "Reiniciar",
    icono: "🗑️",
  },
  {
    ruta: "/publico",
    texto: "Pantalla pública",
    icono: "📺",
  },
];

export default function NavbarAdmin() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        padding: "15px",
        marginBottom: "28px",
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "14px",
      }}
    >
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.ruta}
          to={enlace.ruta}
          target={
            enlace.ruta === "/publico" ? "_blank" : undefined
          }
          style={({ isActive }) => ({
            padding: "12px 17px",
            color: isActive ? "#111827" : "white",
            background: isActive ? "#f5c542" : "#374151",
            borderRadius: "9px",
            textDecoration: "none",
            fontWeight: "bold",
          })}
        >
          {enlace.icono} {enlace.texto}
        </NavLink>
      ))}
    </nav>
  );
}