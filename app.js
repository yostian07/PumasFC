const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'Pumas',
    host: 'localhost',
    database: 'PumasDB',
    password: '123456',
    port: 5432,
});

app.use(cors());
app.use(express.static(path.join(__dirname, '/')));
app.use(express.static('docs'));
app.use(bodyParser.json());


// Ruta para registrar pagos
app.post('/registrar-pagos', async (req, res) => {
    const { jugador_id, fecha_pago, monto, comentario } = req.body;

    try {
        await pool.query(
            'INSERT INTO pumas.pagos (jugador_id, fecha_pago, monto, comentario) VALUES ($1, $2, $3, $4)',
            [jugador_id, fecha_pago, monto, comentario]
        );
        res.status(201).json({ message: 'Pago registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar el pago:', error);
        res.status(500).json({ error: 'Error al registrar el pago' });
    }
});


// Endpoint para obtener todos los jugadores
app.get('/jugadores', async (req, res) => {
    const search = req.query.q || '';
    try {
        const result = await pool.query(
            'SELECT * FROM pumas.jugadores WHERE nombre ILIKE $1 OR cedula ILIKE $1',
            [`%${search}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener jugadores');
    }
});

// Endpoint para obtener un jugador específico por ID
app.get('/jugadores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM pumas.jugadores WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el jugador:', error);
        res.status(500).json({ error: 'Error al obtener el jugador' });
    }
});


// Endpoint para registrar un nuevo jugador
app.post('/jugadores', async (req, res) => {
    const { nombre, cedula, categoria, encargado } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO pumas.jugadores (nombre, cedula, categoria, encargado) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, cedula, categoria, encargado]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al agregar jugador');
    }
});

// Endpoint para actualizar un jugador
app.put('/jugadores/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, cedula, categoria, encargado } = req.body;
    try {
        const result = await pool.query(
            'UPDATE pumas.jugadores SET nombre = $1, cedula = $2, categoria = $3, encargado = $4 WHERE id = $5 RETURNING *',
            [nombre, cedula, categoria, encargado, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar jugador');
    }
});


// Endpoint para obtener un pago específico
app.get('/pagos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT p.id, p.fecha_pago, p.monto, p.comentario, j.cedula AS cedula_jugador, j.nombre AS nombre
            FROM pumas.pagos p
            JOIN pumas.jugadores j ON p.jugador_id = j.id
            WHERE p.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).send('Pago no encontrado');
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener pago');
    }
});


// Endpoint para actualizar un pago
app.put('/pagos/:id', async (req, res) => {
    const { id } = req.params;
    const { cedula, fecha_pago, monto, comentario } = req.body;

    try {
        const jugador = await pool.query('SELECT id FROM pumas.jugadores WHERE cedula = $1', [cedula]);
        if (jugador.rows.length === 0) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        const jugadorId = jugador.rows[0].id;
        const result = await pool.query(
            'UPDATE pumas.pagos SET jugador_id = $1, fecha_pago = $2, monto = $3, comentario = $4 WHERE id = $5 RETURNING *',
            [jugadorId, fecha_pago, monto, comentario, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar pago');
    }
});


// Endpoint para eliminar un pago
app.delete('/pagos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM pumas.pagos WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar pago');
    }
});

// Endpoint para obtener todos los pagos con búsqueda y filtrado
app.get('/pagos', async (req, res) => {
    const { q, month } = req.query;
    let query = `
        SELECT p.id, p.fecha_pago, p.monto, p.comentario, j.nombre, j.cedula
        FROM pumas.pagos p
        JOIN pumas.jugadores j ON p.jugador_id = j.id
    `;
    let queryParams = [];
    let conditions = [];

    if (q) {
        conditions.push(`(j.nombre ILIKE $${queryParams.length + 1} OR j.cedula ILIKE $${queryParams.length + 1})`);
        queryParams.push(`%${q}%`);
    }

    if (month) {
        conditions.push(`DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', $${queryParams.length + 1}::date)`);
        queryParams.push(`${month}-01`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // Para depuración
    console.log('Consulta:', query);
    console.log('Parámetros:', queryParams);

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener pagos');
    }
});




// Endpoint para exportar pagos a CSV
app.get('/exportar-pagos-csv', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pumas.pagos');
        const pagos = result.rows;

        const fields = ['jugador_id', 'fecha_pago', 'monto', 'comentario'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(pagos);

        const filePath = path.join(__dirname, 'pagos.csv');
        fs.writeFileSync(filePath, csv);

        res.download(filePath, 'pagos.csv');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al exportar el reporte CSV');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
