const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'buildit_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Connection
pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to MariaDB!');
    conn.release();
  })
  .catch(err => {
    console.error('Error connecting to MariaDB:', err);
  });

// --- API ROUTES ---

// 1. Get all projects (including portfolio aggregates)
app.get('/api/projects', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        COALESCE(r.total_inflow, 0) AS client_inflow_received,
        COALESCE(b.total_spent, 0) AS live_capital_spent,
        (COALESCE(r.total_inflow, 0) - COALESCE(b.total_spent, 0)) AS available_cash_balance
      FROM projects p
      LEFT JOIN (
        SELECT project_id, SUM(amount) AS total_inflow
        FROM client_receipts
        GROUP BY project_id
      ) r ON p.id = r.project_id
      LEFT JOIN (
        SELECT project_id, SUM(amount) AS total_spent
        FROM material_bills
        GROUP BY project_id
      ) b ON p.id = b.project_id
      ORDER BY p.status ASC, p.created_at DESC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// 2. Get specific project details along with client receipts and material bills
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projectQuery = `
      SELECT 
        p.*,
        COALESCE(r.total_inflow, 0) AS client_inflow_received,
        COALESCE(b.total_spent, 0) AS live_capital_spent,
        (COALESCE(r.total_inflow, 0) - COALESCE(b.total_spent, 0)) AS available_cash_balance
      FROM projects p
      LEFT JOIN (
        SELECT project_id, SUM(amount) AS total_inflow
        FROM client_receipts
        WHERE project_id = ?
      ) r ON p.id = r.project_id
      LEFT JOIN (
        SELECT project_id, SUM(amount) AS total_spent
        FROM material_bills
        WHERE project_id = ?
      ) b ON p.id = b.project_id
      WHERE p.id = ?;
    `;
    const [projectRows] = await pool.query(projectQuery, [id, id, id]);
    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const receiptsQuery = `SELECT * FROM client_receipts WHERE project_id = ? ORDER BY date_received DESC, id DESC;`;
    const [receiptsRows] = await pool.query(receiptsQuery, [id]);

    const billsQuery = `SELECT * FROM material_bills WHERE project_id = ? ORDER BY date_logged DESC, id DESC;`;
    const [billsRows] = await pool.query(billsQuery, [id]);

    // Material tags aggregation
    const tagsQuery = `
      SELECT phase_tag, SUM(amount) AS total_amount
      FROM material_bills
      WHERE project_id = ?
      GROUP BY phase_tag;
    `;
    const [tagsRows] = await pool.query(tagsQuery, [id]);
    
    const phaseTags = {
      Foundation: 0,
      Brickwork: 0,
      Plastering: 0,
      Flooring: 0,
      Electrical: 0,
      Painting: 0
    };
    
    tagsRows.forEach(row => {
      if (phaseTags[row.phase_tag] !== undefined) {
        phaseTags[row.phase_tag] = parseFloat(row.total_amount);
      }
    });

    res.json({
      project: projectRows[0],
      receipts: receiptsRows,
      material_bills: billsRows,
      phase_tags: phaseTags
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve project details' });
  }
});

// 3. Create a new project
app.post('/api/projects', async (req, res) => {
  const { name, location, client_name, budget, status, start_date, built_up_area, progress } = req.body;
  if (!name || !location || !client_name) {
    return res.status(400).json({ error: 'Name, location, and client name are required' });
  }
  try {
    const query = `
      INSERT INTO projects (name, location, client_name, budget, status, start_date, built_up_area, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await pool.query(query, [
      name,
      location,
      client_name,
      budget || 0.00,
      status || 'active',
      start_date || new Date().toISOString().slice(0, 10),
      built_up_area || 0.00,
      progress || 0
    ]);
    res.status(201).json({ id: result.insertId, message: 'Project created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 4. Update a project
app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, client_name, budget, status, start_date, built_up_area, progress } = req.body;
  try {
    const query = `
      UPDATE projects 
      SET name = ?, location = ?, client_name = ?, budget = ?, status = ?, start_date = ?, built_up_area = ?, progress = ?
      WHERE id = ?;
    `;
    await pool.query(query, [name, location, client_name, budget, status, start_date, built_up_area, progress, id]);
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// 5. Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 6. Log client cash receipt (Client Inflow)
app.post('/api/projects/:id/receipts', async (req, res) => {
  const { id } = req.params;
  const { amount, date_received, payment_method, milestone, ref_num, received_from, memo, recorded_by } = req.body;
  if (!amount || !date_received || !payment_method || !milestone || !received_from) {
    return res.status(400).json({ error: 'Missing required receipt fields' });
  }
  try {
    const query = `
      INSERT INTO client_receipts (project_id, amount, date_received, payment_method, milestone, ref_num, received_from, memo, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await pool.query(query, [
      id,
      amount,
      date_received,
      payment_method,
      milestone,
      ref_num || '',
      received_from,
      memo || '',
      recorded_by || 'Admin'
    ]);
    res.status(201).json({ id: result.insertId, message: 'Client receipt logged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log receipt' });
  }
});

// 7. Delete client receipt
app.delete('/api/receipts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM client_receipts WHERE id = ?', [id]);
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// 8. Log material bill (Expense/Outflow)
app.post('/api/projects/:id/material-bills', async (req, res) => {
  const { id } = req.params;
  const { item_name, phase_tag, quantity, unit, amount, vendor, invoice_ref, payment_status, date_logged } = req.body;
  if (!item_name || !phase_tag || !quantity || !unit || !amount || !vendor || !date_logged) {
    return res.status(400).json({ error: 'Missing required material bill fields' });
  }
  try {
    const query = `
      INSERT INTO material_bills (project_id, item_name, phase_tag, quantity, unit, amount, vendor, invoice_ref, payment_status, date_logged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await pool.query(query, [
      id,
      item_name,
      phase_tag,
      quantity,
      unit,
      amount,
      vendor,
      invoice_ref || '',
      payment_status || 'paid',
      date_logged
    ]);
    res.status(201).json({ id: result.insertId, message: 'Material bill logged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log material bill' });
  }
});

// 9. Delete material bill
app.delete('/api/material-bills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM material_bills WHERE id = ?', [id]);
    res.json({ message: 'Material bill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete material bill' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
