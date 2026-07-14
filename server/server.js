const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// Verificación del servidor
app.get("/", (req, res) => {
  res.send("ChakanaScore API funcionando 🚀");
});

// Categorías
app.get("/categorias", (req, res) => {
  db.all(
    "SELECT id, nombre FROM categorias ORDER BY id",
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudieron cargar las categorías.",
        });
      }

      res.json(rows);
    }
  );
});

// Participantes de una categoría
app.get("/participantes/:categoria", (req, res) => {

    db.all(
        `
        SELECT
            id,
            codigo,
            nombre,
            categoria_id
        FROM participantes
        WHERE categoria_id=?
        ORDER BY id
        `,
        [req.params.categoria],
        (err, rows) => {

            if (err) return res.status(500).json(err);

            res.json(rows);

        }
    );

});

// Jurados
app.get("/jurados", (req, res) => {
  db.all(
    `
    SELECT id, nombre, visible
    FROM jurados
    ORDER BY id
    `,
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudieron cargar los jurados.",
        });
      }

      res.json(rows);
    }
  );
});

// Consultar si un jurado ya evaluó a un participante
app.get("/puntajes/:participante/:jurado", (req, res) => {
  const { participante, jurado } = req.params;

  db.get(
    `
    SELECT *
    FROM puntajes
    WHERE participante_id = ?
      AND jurado_id = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [participante, jurado],
    (err, row) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudo revisar la evaluación.",
        });
      }

      res.json(row || null);
    }
  );
});

// Guardar evaluación
app.post("/puntajes", (req, res) => {
  const {
    participante_id,
    jurado_id,
    danza,
    creatividad,
    espacio,
    mensaje,
    interpretacion,
    descuento,
  } = req.body;

  const participanteId = Number(participante_id);
  const juradoId = Number(jurado_id);

  const valores = [
    Number(danza),
    Number(creatividad),
    Number(espacio),
    Number(mensaje),
    Number(interpretacion),
  ];

  const puntajesValidos = valores.every(
    (valor) =>
      Number.isInteger(valor) &&
      valor >= 1 &&
      valor <= 10
  );

  if (
    !Number.isInteger(participanteId) ||
    !Number.isInteger(juradoId) ||
    !puntajesValidos
  ) {
    return res.status(400).json({
      error: "Datos de evaluación inválidos.",
    });
  }

  const descuentoFinal = Math.max(
    0,
    Number(descuento) || 0
  );

  const total = Math.max(
    0,
    valores.reduce((suma, valor) => suma + valor, 0) -
      descuentoFinal
  );

  // Evita una segunda evaluación del mismo jurado
  db.get(
    `
    SELECT id
    FROM puntajes
    WHERE participante_id = ?
      AND jurado_id = ?
    LIMIT 1
    `,
    [participanteId, juradoId],
    (errorConsulta, evaluacionExistente) => {
      if (errorConsulta) {
        console.error(errorConsulta);

        return res.status(500).json({
          error: "No se pudo verificar la evaluación.",
        });
      }

      if (evaluacionExistente) {
        return res.status(409).json({
          error:
            "Este competidor ya fue evaluado por este jurado.",
        });
      }

      db.run(
        `
        INSERT INTO puntajes (
          participante_id,
          jurado_id,
          danza,
          creatividad,
          espacio,
          mensaje,
          interpretacion,
          descuento,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          participanteId,
          juradoId,
          valores[0],
          valores[1],
          valores[2],
          valores[3],
          valores[4],
          descuentoFinal,
          total,
        ],
        function (err) {
          if (err) {
            console.error(err);

            return res.status(500).json({
              error: "No se pudo guardar la evaluación.",
            });
          }

          res.status(201).json({
            mensaje: "Evaluación guardada correctamente.",
            id: this.lastID,
            total,
          });
        }
      );
    }
  );
});

// Ranking y resultados por categoría
app.get("/resultados/:categoria", (req, res) => {
  const categoriaId = Number(req.params.categoria);

  if (!Number.isInteger(categoriaId)) {
    return res.status(400).json({
      error: "Categoría inválida.",
    });
  }

  db.all(
    `
    SELECT
      p.id,
      p.nombre,

      COUNT(DISTINCT pu.jurado_id) AS jurados_evaluados,

      COALESCE(
        SUM(
          CASE
            WHEN j.visible = 1 THEN pu.total
            ELSE 0
          END
        ),
        0
      ) AS total_visible,

      COALESCE(
        SUM(
          CASE
            WHEN j.visible = 0 THEN pu.total
            ELSE 0
          END
        ),
        0
      ) AS total_incognito,

      COALESCE(SUM(pu.total), 0) AS total_general

    FROM participantes p

    LEFT JOIN puntajes pu
      ON pu.participante_id = p.id

    LEFT JOIN jurados j
      ON j.id = pu.jurado_id

    WHERE p.categoria_id = ?

    GROUP BY p.id, p.nombre

    ORDER BY
      CASE
        WHEN COUNT(DISTINCT pu.jurado_id) = 5
        THEN COALESCE(SUM(pu.total), 0)
        ELSE 0
      END DESC,
      p.nombre ASC
    `,
    [categoriaId],
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudieron cargar los resultados.",
        });
      }

      res.json(rows);
    }
  );
});
app.get("/avance-categoria/:categoria", (req, res) => {
  const categoriaId = Number(req.params.categoria);

  if (!Number.isInteger(categoriaId)) {
    return res.status(400).json({
      error: "Categoría inválida.",
    });
  }

  db.all(
    `
    SELECT
      j.id,
      j.nombre,
      j.visible,

      COUNT(DISTINCT p.id) AS total_participantes,

      COUNT(DISTINCT pu.participante_id) AS evaluados

    FROM jurados j

    CROSS JOIN participantes p

    LEFT JOIN puntajes pu
      ON pu.jurado_id = j.id
      AND pu.participante_id = p.id

    WHERE p.categoria_id = ?

    GROUP BY j.id, j.nombre, j.visible

    ORDER BY j.id
    `,
    [categoriaId],
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudo cargar el avance de los jurados.",
        });
      }

      res.json(rows);
    }
  );
});
app.put("/participantes/:id", (req, res) => {
  const participanteId = Number(req.params.id);
  const nombre = String(req.body.nombre || "").trim();

  if (!Number.isInteger(participanteId) || nombre.length < 2) {
    return res.status(400).json({
      error: "El nombre ingresado no es válido.",
    });
  }

  db.run(
    `
    UPDATE participantes
    SET nombre = ?
    WHERE id = ?
    `,
    [nombre, participanteId],
    function (err) {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudo actualizar el participante.",
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Participante no encontrado.",
        });
      }

      res.json({
        mensaje: "Participante actualizado correctamente.",
      });
    }
  );
});
app.get("/detalle-resultados/:categoria", (req, res) => {
  const categoriaId = Number(req.params.categoria);

  if (!Number.isInteger(categoriaId)) {
    return res.status(400).json({
      error: "Categoría inválida.",
    });
  }

  db.all(
    `
    SELECT
      p.id AS participante_id,
      p.nombre AS participante,

      MAX(CASE WHEN pu.jurado_id = 1 THEN pu.total END) AS jurado_1,
      MAX(CASE WHEN pu.jurado_id = 2 THEN pu.total END) AS jurado_2,
      MAX(CASE WHEN pu.jurado_id = 3 THEN pu.total END) AS jurado_3,
      MAX(CASE WHEN pu.jurado_id = 4 THEN pu.total END) AS jurado_4,
      MAX(CASE WHEN pu.jurado_id = 5 THEN pu.total END) AS jurado_5,

      COUNT(DISTINCT pu.jurado_id) AS jurados_evaluados,
      COALESCE(SUM(pu.total), 0) AS total_general

    FROM participantes p

    LEFT JOIN puntajes pu
      ON pu.participante_id = p.id

    WHERE p.categoria_id = ?

    GROUP BY p.id, p.nombre

    ORDER BY
      CASE
        WHEN COUNT(DISTINCT pu.jurado_id) = 5
        THEN COALESCE(SUM(pu.total), 0)
        ELSE 0
      END DESC,
      p.nombre ASC
    `,
    [categoriaId],
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudieron cargar los resultados detallados.",
        });
      }

      res.json(rows);
    }
  );
});
app.get("/participante/:id", (req, res) => {
  const participanteId = Number(req.params.id);

  if (!Number.isInteger(participanteId)) {
    return res.status(400).json({
      error: "Participante inválido.",
    });
  }

  db.get(
    `
    SELECT
      p.id,
      p.codigo,
      p.nombre,
      p.categoria_id,
      c.nombre AS categoria
    FROM participantes p
    INNER JOIN categorias c
      ON c.id = p.categoria_id
    WHERE p.id = ?
    `,
    [participanteId],
    (err, participante) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: "No se pudo cargar el participante.",
        });
      }

      if (!participante) {
        return res.status(404).json({
          error: "Participante no encontrado.",
        });
      }

      res.json(participante);
    }
  );
});
app.get("/torneo", (req, res) => {
  db.get(
    `
    SELECT *
    FROM torneo
    ORDER BY id DESC
    LIMIT 1
    `,
    (err, torneo) => {
      if (err) {
        return res.status(500).json({
          error: "No se pudo cargar el torneo.",
        });
      }

      res.json(torneo || null);
    }
  );
});

app.post("/torneo", (req, res) => {
  const {
    nombre,
    lugar,
    fecha,
    jurados,
    incognito,
  } = req.body;

  const nombreLimpio = String(nombre || "").trim();

  if (nombreLimpio.length < 3) {
    return res.status(400).json({
      error: "El nombre del torneo no es válido.",
    });
  }

  db.run(
    `
    INSERT INTO torneo (
      nombre,
      lugar,
      fecha,
      jurados,
      incognito
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      nombreLimpio,
      String(lugar || "").trim(),
      String(fecha || ""),
      Number(jurados) || 5,
      incognito ? 1 : 0,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: "No se pudo guardar el torneo.",
        });
      }

      res.status(201).json({
        mensaje: "Torneo guardado correctamente.",
        id: this.lastID,
      });
    }
  );
});
app.listen(3001, () => {
  console.log("✅ Servidor iniciado en http://localhost:3001");
});