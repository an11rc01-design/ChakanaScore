import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import NavbarAdmin from "../components/NavbarAdmin";
import logoWiracocha from "../assets/logo-wiracocha.jpeg";

const API_URL = "https://chakanascore.onrender.com";
async function convertirImagenADataURL(rutaImagen) {
  const respuesta = await fetch(rutaImagen);

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el logo.");
  }

  const blob = await respuesta.blob();

  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onloadend = () => resolve(lector.result);
    lector.onerror = () => reject(
      new Error("No se pudo convertir el logo.")
    );

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
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const [respuestaCategorias, respuestaTorneo] = await Promise.all([
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/torneo`),
        ]);

        if (!respuestaCategorias.ok) {
          throw new Error("No se pudieron cargar las categorías.");
        }

        const datosCategorias = await respuestaCategorias.json();
        const datosTorneo = respuestaTorneo.ok
          ? await respuestaTorneo.json()
          : null;

        setCategorias(datosCategorias);
        setTorneo(datosTorneo);

        if (datosCategorias.length > 0) {
          setCategoriaId(String(datosCategorias[0].id));
        }
      } catch (errorCarga) {
        console.error(errorCarga);
        setError(errorCarga.message);
        setCargando(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (!categoriaId) {
      return undefined;
    }

    async function cargarResultados() {
      try {
        const respuesta = await fetch(
          `${API_URL}/detalle-resultados/${categoriaId}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los resultados.");
        }

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

  function limpiarNombreArchivo(texto) {
    return String(texto || "archivo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function resultadoCompleto(resultado) {
    return Number(resultado.jurados_evaluados) === 5;
  }

  function obtenerLugar(resultado, indice) {
    return resultadoCompleto(resultado) ? indice + 1 : "";
  }

  function crearFilasExcel(lista) {
    return lista.map((resultado, indice) => ({
      Lugar: obtenerLugar(resultado, indice),
      Código: resultado.codigo || "",
      Competidor: resultado.participante,
      "Jurado 1": resultado.jurado_1 ?? "",
      "Jurado 2": resultado.jurado_2 ?? "",
      "Jurado 3": resultado.jurado_3 ?? "",
      "Jurado 4": resultado.jurado_4 ?? "",
      "Jurado 5 - Incógnito": resultado.jurado_5 ?? "",
      "Jurados evaluados": `${resultado.jurados_evaluados}/5`,
      "Puntaje total": resultadoCompleto(resultado)
        ? resultado.total_general
        : "Pendiente",
    }));
  }

  async function obtenerTodasLasCategorias() {
    const respuestas = await Promise.all(
      categorias.map(async (categoria) => {
        const respuesta = await fetch(
          `${API_URL}/detalle-resultados/${categoria.id}`
        );

        if (!respuesta.ok) {
          throw new Error(
            `No se pudieron cargar los resultados de ${categoria.nombre}.`
          );
        }

        const datos = await respuesta.json();

        return {
          categoria,
          resultados: datos,
        };
      })
    );

    return respuestas;
  }

  function agregarResumenExcel(libro, datosCategorias) {
    const filasResumen = datosCategorias.map(({ categoria, resultados }) => {
      const completos = resultados.filter(resultadoCompleto).length;
      const total = resultados.length;
      const evaluaciones = resultados.reduce(
        (suma, resultado) =>
          suma + Number(resultado.jurados_evaluados || 0),
        0
      );

      return {
        Categoría: categoria.nombre,
        Competidores: total,
        "Competidores completos": completos,
        "Evaluaciones realizadas": evaluaciones,
        "Evaluaciones requeridas": total * 5,
        Estado:
          total > 0 && completos === total
            ? "Categoría completa"
            : "Evaluaciones pendientes",
      };
    });

    const hojaResumen = XLSX.utils.json_to_sheet(filasResumen, {
      origin: "A6",
    });

    XLSX.utils.sheet_add_aoa(
      hojaResumen,
      [
        [nombreTorneo],
        ["RESULTADOS GENERALES DE LA COMPETENCIA"],
        [`Lugar: ${lugarTorneo || "No informado"}`],
        [`Fecha: ${fechaTorneo || "No informada"}`],
        [],
      ],
      { origin: "A1" }
    );

    hojaResumen["!cols"] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
    ];

    XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");
  }

  function exportarExcelCategoria() {
    if (resultados.length === 0) {
      alert("No existen resultados para exportar.");
      return;
    }

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(crearFilasExcel(resultados), {
      origin: "A6",
    });

    XLSX.utils.sheet_add_aoa(
      hoja,
      [
        [nombreTorneo],
        ["RESULTADOS DE CATEGORÍA"],
        [`Categoría: ${nombreCategoria}`],
        [`Lugar: ${lugarTorneo || "No informado"}`],
        [`Fecha: ${fechaTorneo || "No informada"}`],
      ],
      { origin: "A1" }
    );

    hoja["!cols"] = [
      { wch: 9 },
      { wch: 12 },
      { wch: 34 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      nombreCategoria.substring(0, 31)
    );

    XLSX.writeFile(
      libro,
      `Resultados_${limpiarNombreArchivo(nombreCategoria)}.xlsx`
    );
  }

  async function exportarExcelCompleto() {
    if (categorias.length === 0) {
      alert("No existen categorías para exportar.");
      return;
    }

    setExportando(true);

    try {
      const datosCategorias = await obtenerTodasLasCategorias();
      const libro = XLSX.utils.book_new();

      agregarResumenExcel(libro, datosCategorias);

      datosCategorias.forEach(({ categoria, resultados: lista }) => {
        const hoja = XLSX.utils.json_to_sheet(crearFilasExcel(lista), {
          origin: "A6",
        });

        XLSX.utils.sheet_add_aoa(
          hoja,
          [
            [nombreTorneo],
            ["RESULTADOS OFICIALES"],
            [`Categoría: ${categoria.nombre}`],
            [`Lugar: ${lugarTorneo || "No informado"}`],
            [`Fecha: ${fechaTorneo || "No informada"}`],
          ],
          { origin: "A1" }
        );

        hoja["!cols"] = [
          { wch: 9 },
          { wch: 12 },
          { wch: 34 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 20 },
          { wch: 18 },
          { wch: 16 },
        ];

        XLSX.utils.book_append_sheet(
          libro,
          hoja,
          categoria.nombre.substring(0, 31)
        );
      });

      XLSX.writeFile(
        libro,
        `Resultados_Completos_${limpiarNombreArchivo(nombreTorneo)}.xlsx`
      );
    } catch (errorExportacion) {
      console.error(errorExportacion);
      alert(errorExportacion.message);
    } finally {
      setExportando(false);
    }
  }

  async function agregarCabeceraPDF(documento, subtitulo) {
  try {
    const logoBase64 = await convertirImagenADataURL(
      logoWiracocha
    );

    documento.addImage(
      logoBase64,
      "JPEG",
      12,
      7,
      30,
      30
    );

    documento.addImage(
      logoBase64,
      "JPEG",
      255,
      7,
      30,
      30
    );
  } catch (errorLogo) {
    console.error("Error cargando logo en PDF:", errorLogo);
  }

  documento.setFont("helvetica", "bold");
  documento.setFontSize(19);

  documento.text(
    "PRODUCCIONES WIRACOCHA",
    148,
    13,
    { align: "center" }
  );

  documento.setFontSize(17);

  documento.text(
    nombreTorneo.toUpperCase(),
    148,
    21,
    { align: "center" }
  );

  documento.setFontSize(13);

  documento.text(
    subtitulo.toUpperCase(),
    148,
    29,
    { align: "center" }
  );

  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);

  const informacion = [
    lugarTorneo ? `Lugar: ${lugarTorneo}` : "",
    fechaTorneo ? `Fecha: ${fechaTorneo}` : "",
  ]
    .filter(Boolean)
    .join("    |    ");

  if (informacion) {
    documento.text(informacion, 148, 36, {
      align: "center",
    });
  }

  documento.setDrawColor(184, 126, 45);
  documento.line(12, 40, 285, 40);
}

  
  function crearFilasPDF(lista) {
    return lista.map((resultado, indice) => [
      obtenerLugar(resultado, indice) || "—",
      resultado.codigo || "—",
      resultado.participante,
      resultado.jurado_1 ?? "—",
      resultado.jurado_2 ?? "—",
      resultado.jurado_3 ?? "—",
      resultado.jurado_4 ?? "—",
      resultado.jurado_5 ?? "—",
      `${resultado.jurados_evaluados}/5`,
      resultadoCompleto(resultado)
        ? resultado.total_general
        : "Pendiente",
    ]);
  }

  function agregarTablaPDF(documento, lista, startY = 38) {
    autoTable(documento, {
      startY,
      head: [
        [
          "Lugar",
          "Código",
          "Competidor",
          "J1",
          "J2",
          "J3",
          "J4",
          "J5",
          "Evaluados",
          "Total",
        ],
      ],
      body: crearFilasPDF(lista),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [49, 46, 24],
        textColor: [245, 197, 66],
        fontStyle: "bold",
      },
      columnStyles: {
        2: {
          halign: "left",
          cellWidth: 58,
        },
      },
    });
  }

  function agregarFirmasPDF(documento) {
    const finalY = documento.lastAutoTable?.finalY || 150;
    const paginaAlto = documento.internal.pageSize.getHeight();
    const posicionFirma = Math.min(finalY + 25, paginaAlto - 20);

    documento.setFontSize(9);
    documento.setFont("helvetica", "normal");

    documento.line(25, posicionFirma, 90, posicionFirma);
    documento.text("Firma organización", 57, posicionFirma + 5, {
      align: "center",
    });

    documento.line(205, posicionFirma, 270, posicionFirma);
    documento.text("Firma jurado responsable", 237, posicionFirma + 5, {
      align: "center",
    });
  }

  async function exportarPDFCategoria() {
    if (resultados.length === 0) {
      alert("No existen resultados para exportar.");
      return;
    }

    const documento = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    await agregarCabeceraPDF(
  documento,
  `Resultados oficiales - ${nombreCategoria}`
);
    agregarTablaPDF(documento, resultados);
    agregarFirmasPDF(documento);

    documento.save(
      `Resultados_${limpiarNombreArchivo(nombreCategoria)}.pdf`
    );
  }

  async function exportarPDFCompleto() {
    if (categorias.length === 0) {
      alert("No existen categorías para exportar.");
      return;
    }

    setExportando(true);

    try {
      const datosCategorias = await obtenerTodasLasCategorias();

      const documento = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      await agregarCabeceraPDF(
  documento,
  "Resultados generales de la competencia"
);

      const filasResumen = datosCategorias.map(
        ({ categoria, resultados: lista }) => {
          const completos = lista.filter(resultadoCompleto).length;
          const total = lista.length;

          return [
            categoria.nombre,
            total,
            completos,
            total > 0 && completos === total
              ? "Completa"
              : "Pendiente",
          ];
        }
      );

      autoTable(documento, {
        startY: 38,
        head: [
          [
            "Categoría",
            "Competidores",
            "Completos",
            "Estado",
          ],
        ],
        body: filasResumen,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4,
          halign: "center",
        },
        headStyles: {
          fillColor: [49, 46, 24],
          textColor: [245, 197, 66],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "left", cellWidth: 85 },
        },
      });

      for (const { categoria, resultados: lista } of datosCategorias) {

  documento.addPage("a4", "landscape");

  await agregarCabeceraPDF(
    documento,
    `Resultados oficiales - ${categoria.nombre}`
  );

  agregarTablaPDF(documento, lista);

  agregarFirmasPDF(documento);

}

      documento.save(
        `Resultados_Completos_${limpiarNombreArchivo(nombreTorneo)}.pdf`
      );
    } catch (errorExportacion) {
      console.error(errorExportacion);
      alert(errorExportacion.message);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "35px 20px",
        boxSizing: "border-box",
        background: "#111827",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <NavbarAdmin />

        <button
          onClick={() => navigate("/administrador")}
          style={estiloBotonVolver}
        >
          ← Volver al administrador
        </button>

        <h1
          style={{
            color: "#f5c542",
            fontSize: "42px",
            marginBottom: "8px",
          }}
        >
          Resultados y exportación
        </h1>

        <p style={{ color: "#d1d5db", fontSize: "18px" }}>
          Descarga una categoría o toda la competencia en Excel y PDF.
        </p>

        <section
          style={{
            marginTop: "25px",
            marginBottom: "22px",
            padding: "20px",
            background: "#1f2937",
            borderRadius: "14px",
          }}
        >
          <label
            htmlFor="categoria-resultados"
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "18px",
            }}
          >
            Categoría
          </label>

          <select
            id="categoria-resultados"
            value={categoriaId}
            onChange={(evento) => {
              setCategoriaId(evento.target.value);
              setCargando(true);
            }}
            style={{
              width: "100%",
              padding: "14px",
              border: "2px solid #f5c542",
              borderRadius: "10px",
              fontSize: "19px",
            }}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </section>

        <h3 style={{ color: "#f5c542" }}>Exportar categoría seleccionada</h3>

        <section style={estiloGrupoBotones}>
          <button
            onClick={exportarExcelCategoria}
            disabled={cargando || resultados.length === 0}
            style={{
              ...estiloBotonExportar,
              background: "#15803d",
              opacity:
                cargando || resultados.length === 0 ? 0.6 : 1,
            }}
          >
            📊 Excel de esta categoría
          </button>

          <button
            onClick={exportarPDFCategoria}
            disabled={cargando || resultados.length === 0}
            style={{
              ...estiloBotonExportar,
              background: "#b91c1c",
              opacity:
                cargando || resultados.length === 0 ? 0.6 : 1,
            }}
          >
            📄 PDF de esta categoría
          </button>
        </section>

        <h3 style={{ color: "#f5c542", marginTop: "28px" }}>
          Exportar competencia completa
        </h3>

        <section style={estiloGrupoBotones}>
          <button
            onClick={exportarExcelCompleto}
            disabled={exportando || categorias.length === 0}
            style={{
              ...estiloBotonExportar,
              background: "#166534",
              opacity: exportando ? 0.6 : 1,
            }}
          >
            📊 Excel con todas las categorías
          </button>

          <button
            onClick={exportarPDFCompleto}
            disabled={exportando || categorias.length === 0}
            style={{
              ...estiloBotonExportar,
              background: "#991b1b",
              opacity: exportando ? 0.6 : 1,
            }}
          >
            📄 PDF con toda la competencia
          </button>
        </section>

        {exportando && (
          <p
            style={{
              padding: "14px",
              marginTop: "18px",
              background: "#1e3a8a",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            Preparando archivo completo...
          </p>
        )}

        <h2
          style={{
            textAlign: "center",
            color: "#f5c542",
            fontSize: "34px",
            marginTop: "35px",
          }}
        >
          {nombreCategoria}
        </h2>

        {cargando && <p>Cargando resultados...</p>}

        {error && (
          <p
            style={{
              padding: "15px",
              background: "#7f1d1d",
              color: "#fecaca",
              borderRadius: "10px",
            }}
          >
            {error}
          </p>
        )}

        {!cargando && !error && (
          <div
            style={{
              overflowX: "auto",
              marginTop: "25px",
              borderRadius: "14px",
              border: "1px solid #4b5563",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "1100px",
                borderCollapse: "collapse",
                background: "#1f2937",
              }}
            >
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
                    <div
                      style={{
                        color: "#f5c542",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      Incógnito
                    </div>
                  </th>
                  <th style={estiloEncabezado}>Evaluados</th>
                  <th style={estiloEncabezado}>Total</th>
                </tr>
              </thead>

              <tbody>
                {resultados.map((resultado, indice) => {
                  const completo = resultadoCompleto(resultado);

                  return (
                    <tr
                      key={resultado.participante_id}
                      style={{
                        background:
                          indice === 0 && completo
                            ? "#4c3a0a"
                            : "#1f2937",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      <td style={estiloCelda}>
                        {completo ? `${indice + 1}°` : "—"}
                      </td>

                      <td
                        style={{
                          ...estiloCelda,
                          color: "#f5c542",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        {resultado.codigo || "—"}
                      </td>

                      <td
                        style={{
                          ...estiloCelda,
                          textAlign: "left",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        {resultado.participante}
                      </td>

                      <td style={estiloCelda}>
                        {resultado.jurado_1 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_2 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_3 ?? "—"}
                      </td>
                      <td style={estiloCelda}>
                        {resultado.jurado_4 ?? "—"}
                      </td>
                      <td
                        style={{
                          ...estiloCelda,
                          color: "#f5c542",
                          fontWeight: "bold",
                        }}
                      >
                        {resultado.jurado_5 ?? "?"}
                      </td>

                      <td style={estiloCelda}>
                        {resultado.jurados_evaluados} / 5
                      </td>

                      <td
                        style={{
                          ...estiloCelda,
                          color: completo
                            ? "#f5c542"
                            : "#d1d5db",
                          fontWeight: "bold",
                          fontSize: "22px",
                        }}
                      >
                        {completo
                          ? resultado.total_general
                          : "Pendiente"}
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

const estiloGrupoBotones = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "15px",
  marginBottom: "15px",
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
