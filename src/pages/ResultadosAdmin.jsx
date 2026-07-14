import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";

export default function ResultadosAdmin() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const respuesta = await fetch(`${API_URL}/categorias`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar las categorías.");
        const datos = await respuesta.json();
        setCategorias(datos);
        if (datos.length > 0) setCategoriaId(String(datos[0].id));
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
        setCargando(false);
      }
    }
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (!categoriaId) return undefined;

    async function cargarResultados() {
      try {
        const respuesta = await fetch(`${API_URL}/detalle-resultados/${categoriaId}`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los resultados.");
        const datos = await respuesta.json();
        setResultados(datos);
        setError("");
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
      } finally {
        setCargando(false);
      }
    }

    setCargando(true);
    cargarResultados();
    const intervalo = setInterval(cargarResultados, 3000);
    return () => clearInterval(intervalo);
  }, [categoriaId]);

  const categoriaActual = useMemo(
    () => categorias.find((categoria) => String(categoria.id) === String(categoriaId)),
    [categorias, categoriaId]
  );

  const nombreCategoria = categoriaActual?.nombre || "Categoria";
  const nombreArchivo = nombreCategoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_");

  function obtenerLugar(resultado, indice) {
    return Number(resultado.jurados_evaluados) === 5 ? indice + 1 : "";
  }

  function exportarExcel() {
    if (resultados.length === 0) {
      alert("No existen resultados para exportar.");
      return;
    }

    const filas = resultados.map((resultado, indice) => ({
      Lugar: obtenerLugar(resultado, indice),
      Código: resultado.codigo || "",
      Competidor: resultado.participante,
      "Jurado 1": resultado.jurado_1 ?? "",
      "Jurado 2": resultado.jurado_2 ?? "",
      "Jurado 3": resultado.jurado_3 ?? "",
      "Jurado 4": resultado.jurado_4 ?? "",
      "Jurado 5 - Incógnito": resultado.jurado_5 ?? "",
      "Jurados evaluados": `${resultado.jurados_evaluados}/5`,
      "Puntaje total":
        Number(resultado.jurados_evaluados) === 5
          ? resultado.total_general
          : "Pendiente",
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [
      { wch: 9 }, { wch: 12 }, { wch: 34 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 16 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombreCategoria.substring(0, 31));
    XLSX.writeFile(libro, `Resultados_${nombreArchivo}.xlsx`);
  }

  function exportarPDF() {
    if (resultados.length === 0) {
      alert("No existen resultados para exportar.");
      return;
    }

    const documento = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    documento.setFont("helvetica", "bold");
    documento.setFontSize(20);
    documento.text("LA CHAKANA SAGRADA 2026", 148, 16, { align: "center" });
    documento.setFontSize(15);
    documento.text("RESULTADOS OFICIALES", 148, 25, { align: "center" });
    documento.setFontSize(13);
    documento.text(nombreCategoria.toUpperCase(), 148, 33, { align: "center" });

    const filas = resultados.map((resultado, indice) => [
      obtenerLugar(resultado, indice) || "—",
      resultado.codigo || "—",
      resultado.participante,
      resultado.jurado_1 ?? "—",
      resultado.jurado_2 ?? "—",
      resultado.jurado_3 ?? "—",
      resultado.jurado_4 ?? "—",
      resultado.jurado_5 ?? "—",
      `${resultado.jurados_evaluados}/5`,
      Number(resultado.jurados_evaluados) === 5 ? resultado.total_general : "Pendiente",
    ]);

    autoTable(documento, {
      startY: 40,
      head: [["Lugar", "Código", "Competidor", "J1", "J2", "J3", "J4", "J5", "Evaluados", "Total"]],
      body: filas,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, halign: "center", valign: "middle" },
      headStyles: { fillColor: [49, 46, 24], textColor: [245, 197, 66], fontStyle: "bold" },
      columnStyles: { 2: { halign: "left", cellWidth: 58 } },
    });

    const finalY = documento.lastAutoTable?.finalY || 150;
    documento.setFontSize(10);
    documento.setFont("helvetica", "normal");
    documento.line(25, finalY + 28, 90, finalY + 28);
    documento.text("Firma organización", 57, finalY + 34, { align: "center" });
    documento.line(205, finalY + 28, 270, finalY + 28);
    documento.text("Firma jurado responsable", 237, finalY + 34, { align: "center" });
    documento.save(`Resultados_${nombreArchivo}.pdf`);
  }

  return (
    <div style={{ minHeight: "100vh", padding: "35px 20px", boxSizing: "border-box", background: "#111827", color: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <NavbarAdmin />

        <button onClick={() => navigate("/administrador")} style={estiloBotonVolver}>
          ← Volver al administrador
        </button>

        <h1 style={{ color: "#f5c542", fontSize: "42px", marginBottom: "8px" }}>
          Resultados detallados
        </h1>

        <p style={{ color: "#d1d5db", fontSize: "18px" }}>
          Puntajes emitidos por cada jurado
        </p>

        <section style={{ marginTop: "25px", marginBottom: "22px", padding: "20px", background: "#1f2937", borderRadius: "14px" }}>
          <label htmlFor="categoria-resultados" style={{ display: "block", marginBottom: "10px", fontSize: "18px" }}>
            Categoría
          </label>

          <select
            id="categoria-resultados"
            value={categoriaId}
            onChange={(evento) => {
              setCategoriaId(evento.target.value);
              setCargando(true);
            }}
            style={{ width: "100%", padding: "14px", border: "2px solid #f5c542", borderRadius: "10px", fontSize: "19px" }}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "15px", marginBottom: "28px" }}>
          <button
            onClick={exportarExcel}
            disabled={cargando || resultados.length === 0}
            style={{ ...estiloBotonExportar, background: "#15803d", opacity: cargando || resultados.length === 0 ? 0.6 : 1 }}
          >
            📊 Descargar Excel
          </button>

          <button
            onClick={exportarPDF}
            disabled={cargando || resultados.length === 0}
            style={{ ...estiloBotonExportar, background: "#b91c1c", opacity: cargando || resultados.length === 0 ? 0.6 : 1 }}
          >
            📄 Descargar PDF
          </button>
        </section>

        <h2 style={{ textAlign: "center", color: "#f5c542", fontSize: "34px" }}>
          {nombreCategoria}
        </h2>

        {cargando && <p>Cargando resultados...</p>}

        {error && (
          <p style={{ padding: "15px", background: "#7f1d1d", color: "#fecaca", borderRadius: "10px" }}>
            {error}
          </p>
        )}

        {!cargando && !error && (
          <div style={{ overflowX: "auto", marginTop: "25px", borderRadius: "14px", border: "1px solid #4b5563" }}>
            <table style={{ width: "100%", minWidth: "1100px", borderCollapse: "collapse", background: "#1f2937" }}>
              <thead>
                <tr style={{ background: "#312e18" }}>
                  <th style={estiloEncabezado}>Lugar</th>
                  <th style={estiloEncabezado}>Código</th>
                  <th style={estiloEncabezado}>Competidor</th>
                  <th style={estiloEncabezado}>Jurado 1</th>
                  <th style={estiloEncabezado}>Jurado 2</th>
                  <th style={estiloEncabezado}>Jurado 3</th>
                  <th style={estiloEncabezado}>Jurado 4</th>
                  <th style={estiloEncabezado}>
                    Jurado 5
                    <div style={{ color: "#f5c542", fontSize: "12px", marginTop: "4px" }}>Incógnito</div>
                  </th>
                  <th style={estiloEncabezado}>Evaluados</th>
                  <th style={estiloEncabezado}>Total</th>
                </tr>
              </thead>

              <tbody>
                {resultados.map((resultado, indice) => {
                  const completo = Number(resultado.jurados_evaluados) === 5;

                  return (
                    <tr
                      key={resultado.participante_id}
                      style={{
                        background: indice === 0 && completo ? "#4c3a0a" : "#1f2937",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      <td style={estiloCelda}>{completo ? `${indice + 1}°` : "—"}</td>
                      <td style={{ ...estiloCelda, color: "#f5c542", fontWeight: "bold", fontSize: "18px" }}>
                        {resultado.codigo || "—"}
                      </td>
                      <td style={{ ...estiloCelda, textAlign: "left", fontWeight: "bold", fontSize: "18px" }}>
                        {resultado.participante}
                      </td>
                      <td style={estiloCelda}>{resultado.jurado_1 ?? "—"}</td>
                      <td style={estiloCelda}>{resultado.jurado_2 ?? "—"}</td>
                      <td style={estiloCelda}>{resultado.jurado_3 ?? "—"}</td>
                      <td style={estiloCelda}>{resultado.jurado_4 ?? "—"}</td>
                      <td style={{ ...estiloCelda, color: "#f5c542", fontWeight: "bold" }}>
                        {resultado.jurado_5 ?? "?"}
                      </td>
                      <td style={estiloCelda}>{resultado.jurados_evaluados} / 5</td>
                      <td style={{ ...estiloCelda, color: completo ? "#f5c542" : "#d1d5db", fontWeight: "bold", fontSize: "22px" }}>
                        {completo ? resultado.total_general : "Pendiente"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const estiloBotonVolver = {
  padding: "11px 18px",
  background: "#374151",
  color: "white",
  border: "1px solid #6b7280",
  borderRadius: "8px",
  cursor: "pointer",
};

const estiloBotonExportar = {
  padding: "16px",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  fontWeight: "bold",
  cursor: "pointer",
};

const estiloEncabezado = {
  padding: "16px 12px",
  borderBottom: "2px solid #f5c542",
  color: "#f5c542",
  textAlign: "center",
  fontSize: "16px",
};

const estiloCelda = {
  padding: "15px 12px",
  textAlign: "center",
  color: "white",
};