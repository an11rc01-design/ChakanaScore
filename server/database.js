const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./chakana.db");

db.serialize(() => {
    db.run(`
  CREATE TABLE IF NOT EXISTS torneo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    lugar TEXT,
    fecha TEXT,
    jurados INTEGER DEFAULT 5,
    incognito INTEGER DEFAULT 1
  )
`);

    console.log("✅ Base de datos conectada.");

    db.run(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL
        )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT,
        nombre TEXT NOT NULL,
        categoria_id INTEGER
    )
`);

    db.run(`
        CREATE TABLE IF NOT EXISTS jurados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            visible INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS puntajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participante_id INTEGER,
            jurado_id INTEGER,
            danza INTEGER,
            creatividad INTEGER,
            espacio INTEGER,
            mensaje INTEGER,
            interpretacion INTEGER,
            descuento INTEGER,
            total INTEGER
        )
    `);

});

// =========================
// CATEGORÍAS
// =========================

db.get("SELECT COUNT(*) as total FROM categorias", (err, row) => {

    if (row.total === 0) {

        const categorias = [
            "Trío Tinkus",
            "Trío Caporal",
            "Trío Tobas",
            "Chico Caporal",
            "Chica Caporal"
        ];

        categorias.forEach(categoria => {
            db.run(
                "INSERT INTO categorias(nombre) VALUES(?)",
                [categoria]
            );
        });

        console.log("✅ Categorías creadas.");
    }

});

// =========================
// PARTICIPANTES
// =========================

db.get("SELECT COUNT(*) as total FROM participantes", (err, row) => {

    if (row.total === 0) {

        const participantes = [

            // TRÍO TINKUS
            ["Trío Tinkus 1",1],
            ["Trío Tinkus 2",1],
            ["Trío Tinkus 3",1],

            // TRÍO CAPORAL
            ["Trío Caporal 1",2],
            ["Trío Caporal 2",2],
            ["Trío Caporal 3",2],
            ["Trío Caporal 4",2],
            ["Trío Caporal 5",2],
            ["Trío Caporal 6",2],
            ["Trío Caporal 7",2],
            ["Trío Caporal 8",2],
            ["Trío Caporal 9",2],
            ["Trío Caporal 10",2],
            ["Trío Caporal 11",2],
            ["Trío Caporal 12",2],

            // TRÍO TOBAS
            ["Trío Tobas 1",3],
            ["Trío Tobas 2",3],
            ["Trío Tobas 3",3],
            ["Trío Tobas 4",3],
            ["Trío Tobas 5",3],
            ["Trío Tobas 6",3],
            ["Trío Tobas 7",3],

            // CHICO CAPORAL
            ["Chico 1",4],
            ["Chico 2",4],
            ["Chico 3",4],
            ["Chico 4",4],
            ["Chico 5",4],
            ["Chico 6",4],
            ["Chico 7",4],
            ["Chico 8",4],
            ["Chico 9",4],
            ["Chico 10",4],
            ["Chico 11",4],
            ["Chico 12",4],
            ["Chico 13",4],
            ["Chico 14",4],
            ["Chico 15",4],
            ["Chico 16",4],
            ["Chico 17",4],
            ["Chico 18",4],
            ["Chico 19",4],

            // CHICA CAPORAL
            ["Chica 1",5],
            ["Chica 2",5],
            ["Chica 3",5],
            ["Chica 4",5],
            ["Chica 5",5],
            ["Chica 6",5],
            ["Chica 7",5],
            ["Chica 8",5],
            ["Chica 9",5],
            ["Chica 10",5],
            ["Chica 11",5],
            ["Chica 12",5]

        ];

        participantes.forEach(p => {

            db.run(
                "INSERT INTO participantes(nombre,categoria_id) VALUES(?,?)",
                p
            );

        });

        console.log("✅ Participantes creados.");

    }

});
// =========================
// JURADOS
// =========================

db.get("SELECT COUNT(*) AS total FROM jurados", (err, row) => {
    if (err) {
        console.error("Error al revisar jurados:", err);
        return;
    }

    if (row.total === 0) {
        const jurados = [
            ["Jurado 1", 1],
            ["Jurado 2", 1],
            ["Jurado 3", 1],
            ["Jurado 4", 1],
            ["Jurado 5", 0]
        ];

        jurados.forEach((jurado) => {
            db.run(
                "INSERT INTO jurados(nombre, visible) VALUES (?, ?)",
                jurado
            );
        });

        console.log("✅ Jurados creados.");
    }
});
module.exports = db;