const pool = require('../config/db');

// GET /api/users (admin) — list all customers/admins
async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, status, created_at,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = users.id) AS order_count
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

// GET /api/users/:id (admin)
async function getUserById(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const [orders] = await pool.query(
      'SELECT id, order_number, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ ...rows[0], orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

// PUT /api/users/:id/status  { status: 'active' | 'suspended' }
async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'suspended'" });
    }
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own account status' });
    }
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
}

// PUT /api/users/:id/role  { role: 'customer' | 'admin' }
async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'customer' or 'admin'" });
    }
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user role' });
  }
}

module.exports = { getUsers, getUserById, updateUserStatus, updateUserRole };
