const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Add this at the top
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.json({ message: 'User created', user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ error: 'User already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ message: 'Login successful', token });
});

// New route to handle case when no wallet is added
router.get('/wallet', auth, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  if (!user || !user.wallet) {
    return res.status(400).json({ error: 'No wallet added' });
  }
  res.json({ wallet: user.wallet });
});

// New route to add a wallet
router.post('/add-wallet', auth, async (req, res) => {
  const userId = req.user.id;
  const { wallet } = req.body;
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { wallet },
    { new: true }
  );
  res.json({ message: 'Wallet added', wallet: user.wallet });
});

module.exports = router;
