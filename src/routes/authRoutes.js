const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail } = require('../models/userModel');

const router = express.Router();

// Ruta de registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role_id = 1 } = req.body; // Asigna un valor predeterminado de 1
    await createUser(email, password, full_name, role_id);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error); // Loguea el error
    res.status(500).json({ error: error.message });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_id: user.role_id
    };

    res.status(200).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
