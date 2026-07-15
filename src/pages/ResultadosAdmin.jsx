import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import NavbarAdmin from "../components/NavbarAdmin";

const API_URL = "https://chakanascore.onrender.com";
const LOGO_URL = "/logo-wiracocha.jpeg";

async function imagenADataURL(url) {
  const respuesta = await fetch(url, { cache: "no-store" });
  if (!respuesta.ok) throw new Error("No se pudo cargar el logo.");

  const blob = await respuesta.blob();

  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(blob);
  });
}

export default function ResultadosAdmin() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [resultados, setResultados] = useState([]);
  const [torneo, setTorneo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [publicandoId, setPublicandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarInicial() {
      try {
        const [rCategorias, rTorneo] = await Promise.all([
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/torneo`),
        ]);

        if (!rCategorias.ok) {
          throw new Error("No se pudieron cargar las categorías.");
        }

        const datosCategorias = await rCategorias.json();
        const datosTorneo = rTorneo.ok ? await rTorneo.json() : null;

        setCategorias(datosCategorias);
        setTorneo(datosTorneo);

        if (datosCategorias.length > 0) {
          setCategoriaId(String(datosCategorias[0].id));
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
        setCargando(false);
      }
    }

    cargarInicial();
  }, []);

  useEffect(() => {
    if (!categoriaId) return undefined;

    async function cargarResultados() {
      try {
        const respuesta = await fetch(
          `${API_URL}/detalle-resultados/${categoriaId}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los resultados.");
        }

        setResultados(await respuesta.json());
        setError("");
      } catch (e) {
        console.error(e);
        setError(e.message);
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
    () =>
      categorias.find(
        (categoria) => String(categoria.id) === String(categoriaId)
      ),
    [categorias, categoriaId]
  );

  const nombreCategoria = categoriaActual?.nombre || "Categoria";
  const nombreTorneo = torneo?.nombre || "La Chakana Sagrada 2026";
  const lugarTorneo = torneo?.lugar || "";
  const fechaTorneo = torneo?.fecha || "";

  const completo = (r) => Number(r.jurados_evaluados) === 5;
  const lugar = (r, i) => (completo(r) ? i + 1 : "");

  function nombreArchivo(texto) {
    return String(texto || "archivo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function filasExcel(lista) {
    return lista.map((r, i) => ({
      Lugar: lugar(r, i),
      Código: r.codigo || "",
      Competidor: r.participante,
      "Jurado 1": r.jurado_1 ?? "",
      "Jurado 2": r.jurado_2 ?? "",
      "Jurado 3": r.jurado_3 ?? "",
      "Jurado 4": r.jurado_4 ?? "",
      "Jurado 5 - Incógnito": r.jurado_5 ?? "",
      Evaluados: `${r.jurados_evaluados}/5`,
      Total: completo(r) ? r.total_general : "Pendiente",
    }));
  }

  async function cargarTodasLasCategorias() {
    return Promise.all(
      categorias.map(async (categoria) => {
        const respuesta = await fetch(
          `${API_URL}/detalle-resultados/${categoria.id}`
        );

        if (!respuesta.ok) {
          throw new Error(`No se pudo cargar ${categoria.nombre}.`);
        }

        return {
          categoria,
          resultados: await respuesta.json(),
        };
      })
    );
  }

  function exportarExcelCategoria() {
    if (!resultados.length) return alert("No existen resultados.");

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(filasExcel(resultados), {
      origin: "A7",
    });

    XLSX.utils.sheet_add_aoa(
      hoja,
      [
        ["PRODUCCIONES WIRACOCHA"],
        [nombreTorneo],
        ["RESULTADOS OFICIALES"],
        [`Categoría: ${nombreCategoria}`],
        [`Lugar: ${lugarTorneo || "No informado"}`],
        [`Fecha: ${fechaTorneo || "No informada"}`],
      ],
      { origin: "A1" }
    );

    hoja["!cols"] = [
      { wch: 9 }, { wch: 12 }, { wch: 34 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      nombreCategoria.substring(0, 31)
    );

    XLSX.writeFile(
      libro,
      `Resultados_${nombreArchivo(nombreCategoria)}.xlsx`
    );
  }

  async function exportarExcelCompleto() {
    if (!categorias.length) return alert("No existen categorías.");

    setExportando(true);

    try {
      const datos = await cargarTodasLasCategorias();
      const libro = XLSX.utils.book_new();

      const resumen = datos.map(({ categoria, resultados: lista }) => ({
        Categoría: categoria.nombre,
        Competidores: lista.length,
        Completos: lista.filter(completo).length,
        Estado:
          lista.length > 0 && lista.every(completo)
            ? "Completa"
            : "Pendiente",
      }));

      const hojaResumen = XLSX.utils.json_to_sheet(resumen, {
        origin: "A6",
      });

      XLSX.utils.sheet_add_aoa(
        hojaResumen,
        [
          ["PRODUCCIONES WIRACOCHA"],
          [nombreTorneo],
          ["RESULTADOS GENERALES"],
          [`Lugar: ${lugarTorneo || "No informado"}`],
          [`Fecha: ${fechaTorneo || "No informada"}`],
        ],
        { origin: "A1" }
      );

      XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");

      datos.forEach(({ categoria, resultados: lista }) => {
        const hoja = XLSX.utils.json_to_sheet(filasExcel(lista), {
          origin: "A7",
        });

        XLSX.utils.sheet_add_aoa(
          hoja,
          [
            ["PRODUCCIONES WIRACOCHA"],
            [nombreTorneo],
            ["RESULTADOS OFICIALES"],
            [`Categoría: ${categoria.nombre}`],
            [`Lugar: ${lugarTorneo || "No informado"}`],
            [`Fecha: ${fechaTorneo || "No informada"}`],
          ],
          { origin: "A1" }
        );

        XLSX.utils.book_append_sheet(
          libro,
          hoja,
          categoria.nombre.substring(0, 31)
        );
      });

      XLSX.writeFile(
        libro,
        `Resultados_Completos_${nombreArchivo(nombreTorneo)}.xlsx`
      );
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setExportando(false);
    }
  }

  async function cabeceraPDF(documento, subtitulo) {
    try {
      const logo = await imagenADataURL(LOGO_URL);
      documento.addImage(logo, "JPEG", 12, 6, 30, 30);
      documento.addImage(logo, "JPEG", 255, 6, 30, 30);
    } catch (e) {
      console.warn("PDF sin logo:", e);
    }

    documento.setFont("helvetica", "bold");
    documento.setFontSize(18);
    documento.text("PRODUCCIONES WIRACOCHA", 148, 13, {
      align: "center",
    });

    documento.setFontSize(16);
    documento.text(nombreTorneo.toUpperCase(), 148, 21, {
      align: "center",
    });

    documento.setFontSize(12);
    documento.text(subtitulo.toUpperCase(), 148, 29, {
      align: "center",
    });

    documento.setFont("helvetica", "normal");
    documento.setFontSize(9);

    const info = [
      lugarTorneo ? `Lugar: ${lugarTorneo}` : "",
      fechaTorneo ? `Fecha: ${fechaTorneo}` : "",
    ]
      .filter(Boolean)
      .join("   |   ");

    if (info) documento.text(info, 148, 36, { align: "center" });

    documento.setDrawColor(184, 126, 45);
    documento.line(12, 40, 285, 40);
  }

  function filasPDF(lista) {
    return lista.map((r, i) => [
      lugar(r, i) || "—",
      r.codigo || "—",
      r.participante,
      r.jurado_1 ?? "—",
      r.jurado_2 ?? "—",
      r.jurado_3 ?? "—",
      r.jurado_4 ?? "—",
      r.jurado_5 ?? "—",
      `${r.jurados_evaluados}/5`,
      completo(r) ? r.total_general : "Pendiente",
    ]);
  }

  function tablaPDF(documento, lista) {
    autoTable(documento, {
      startY: 45,
      head: [[
        "Lugar", "Código", "Competidor", "J1", "J2",
        "J3", "J4", "J5", "Evaluados", "Total",
      ]],
      body: filasPDF(lista),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.6,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [49, 46, 24],
        textColor: [245, 197, 66],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [247, 242, 231],
      },
      columnStyles: {
        2: { halign: "left", cellWidth: 58 },
      },
    });
  }

  function firmasPDF(documento) {
    const finalY = documento.lastAutoTable?.finalY || 150;
    const alto = documento.internal.pageSize.getHeight();
    const y = Math.min(finalY + 25, alto - 20);

    documento.line(25, y, 90, y);
    documento.line(205, y, 270, y);

    documento.setFontSize(9);
    documento.text("Firma organización", 57, y + 5, {
      align: "center",
    });
    documento.text("Firma jurado responsable", 237, y + 5, {
      align: "center",
    });
  }

  async function exportarPDFCategoria() {
    if (!resultados.length) return alert("No existen resultados.");

    setExportando(true);

    try {
      const documento = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      await cabeceraPDF(
        documento,
        `Resultados oficiales - ${nombreCategoria}`
      );

      tablaPDF(documento, resultados);
      firmasPDF(documento);

      documento.save(
        `Resultados_${nombreArchivo(nombreCategoria)}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setExportando(false);
    }
  }

  async function exportarPDFCompleto() {
    if (!categorias.length) return alert("No existen categorías.");

    setExportando(true);

    try {
      const datos = await cargarTodasLasCategorias();
      const documento = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      await cabeceraPDF(documento, "Resultados generales");

      const resumen = datos.map(({ categoria, resultados: lista }) => [
        categoria.nombre,
        lista.length,
        lista.filter(completo).length,
        lista.length > 0 && lista.every(completo)
          ? "Completa"
          : "Pendiente",
      ]);

      autoTable(documento, {
        startY: 45,
        head: [["Categoría", "Competidores", "Completos", "Estado"]],
        body: resumen,
        theme: "grid",
        headStyles: {
          fillColor: [49, 46, 24],
          textColor: [245, 197, 66],
        },
      });

      for (const { categoria, resultados: lista } of datos) {
        documento.addPage("a4", "landscape");
        await cabeceraPDF(
          documento,
          `Resultados oficiales - ${categoria.nombre}`
        );
        tablaPDF(documento, lista);
        firmasPDF(documento);
      }

      documento.save(
        `Resultados_Completos_${nombreArchivo(nombreTorneo)}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setExportando(false);
    }
  }

  async function publicarPantalla(participanteId) {
    setPublicandoId(participanteId);
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/publicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participante_id: participanteId }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo publicar.");
      }

      setMensaje("✅ Competidor publicado en la pantalla LED.");
    } catch (e) {
      console.error(e);
      setMensaje(`❌ ${e.message}`);
    } finally {
      setPublicandoId(null);
    }
  }

  return (
    <div style={pagina}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <NavbarAdmin />

        <button
          onClick={() => navigate("/administrador")}
          style={botonVolver}
        >
          ← Volver al administrador
        </button>

        <h1 style={titulo}>Resultados y pantalla LED</h1>

        <section style={panel}>
          <label htmlFor="categoria-resultados">
            Categoría
          </label>

          <select
            id="categoria-resultados"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            style={selector}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </section>

        <section style={botonera}>
          <button
            onClick={exportarExcelCategoria}
            style={{ ...botonExportar, background: "#15803d" }}
          >
            📊 Excel categoría
          </button>

          <button
            onClick={exportarPDFCategoria}
            style={{ ...botonExportar, background: "#b91c1c" }}
          >
            📄 PDF categoría
          </button>

          <button
            onClick={exportarExcelCompleto}
            style={{ ...botonExportar, background: "#166534" }}
          >
            📊 Excel completo
          </button>

          <button
            onClick={exportarPDFCompleto}
            style={{ ...botonExportar, background: "#991b1b" }}
          >
            📄 PDF completo
          </button>
        </section>

        <a
          href="/pantalla"
          target="_blank"
          rel="noreferrer"
          style={enlacePantalla}
        >
          📺 Abrir pantalla LED
        </a>

        {mensaje && <p style={mensajeEstilo}>{mensaje}</p>}

        <h2 style={subtitulo}>{nombreCategoria}</h2>

        {cargando && <p>Cargando resultados...</p>}
        {error && <p style={errorEstilo}>{error}</p>}

        {!cargando && !error && (
          <div style={tablaContenedor}>
            <table style={tabla}>
              <thead>
                <tr style={{ background: "#312e18" }}>
                  {[
                    "Lugar", "Código", "Competidor", "J1", "J2", "J3",
                    "J4", "J5", "Evaluados", "Total", "Pantalla LED",
                  ].map((texto) => (
                    <th key={texto} style={encabezado}>
                      {texto}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {resultados.map((r, i) => (
                  <tr
                    key={r.participante_id}
                    style={{ borderBottom: "1px solid #374151" }}
                  >
                    <td style={celda}>
                      {completo(r) ? `${i + 1}°` : "—"}
                    </td>
                    <td style={{ ...celda, color: "#f5c542" }}>
                      {r.codigo || "—"}
                    </td>
                    <td style={{ ...celda, textAlign: "left" }}>
                      {r.participante}
                    </td>
                    <td style={celda}>{r.jurado_1 ?? "—"}</td>
                    <td style={celda}>{r.jurado_2 ?? "—"}</td>
                    <td style={celda}>{r.jurado_3 ?? "—"}</td>
                    <td style={celda}>{r.jurado_4 ?? "—"}</td>
                    <td style={{ ...celda, color: "#f5c542" }}>
                      {r.jurado_5 ?? "?"}
                    </td>
                    <td style={celda}>{r.jurados_evaluados}/5</td>
                    <td style={{ ...celda, color: "#f5c542" }}>
                      {completo(r) ? r.total_general : "Pendiente"}
                    </td>
                    <td style={celda}>
                      <button
                        onClick={() =>
                          publicarPantalla(r.participante_id)
                        }
                        disabled={publicandoId === r.participante_id}
                        style={botonPublicar}
                      >
                        {publicandoId === r.participante_id
                          ? "Publicando..."
                          : "📺 Publicar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  padding: "35px 20px",
  background: "#111827",
  color: "white",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const titulo = {
  color: "#f5c542",
  fontSize: "42px",
};

const subtitulo = {
  textAlign: "center",
  color: "#f5c542",
  fontSize: "34px",
  marginTop: "35px",
};

const panel = {
  margin: "25px 0 22px",
  padding: "20px",
  background: "#1f2937",
  borderRadius: "14px",
};

const selector = {
  display: "block",
  width: "100%",
  marginTop: "10px",
  padding: "14px",
  border: "2px solid #f5c542",
  borderRadius: "10px",
  fontSize: "19px",
};

const botonVolver = {
  padding: "11px 18px",
  background: "#374151",
  color: "white",
  border: "1px solid #6b7280",
  borderRadius: "8px",
  cursor: "pointer",
};

const botonera = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
  marginBottom: "18px",
};

const botonExportar = {
  padding: "16px",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "17px",
  fontWeight: "bold",
  cursor: "pointer",
};

const enlacePantalla = {
  display: "inline-block",
  padding: "14px 20px",
  color: "white",
  background: "#2563eb",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
};

const mensajeEstilo = {
  padding: "14px",
  background: "#14532d",
  borderRadius: "10px",
  textAlign: "center",
};

const errorEstilo = {
  padding: "15px",
  background: "#7f1d1d",
  color: "#fecaca",
  borderRadius: "10px",
};

const tablaContenedor = {
  overflowX: "auto",
  marginTop: "25px",
  borderRadius: "14px",
  border: "1px solid #4b5563",
};

const tabla = {
  width: "100%",
  minWidth: "1320px",
  borderCollapse: "collapse",
  background: "#1f2937",
};

const encabezado = {
  padding: "16px 12px",
  borderBottom: "2px solid #f5c542",
  color: "#f5c542",
  textAlign: "center",
};

const celda = {
  padding: "15px 12px",
  textAlign: "center",
  color: "white",
};

const botonPublicar = {
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};