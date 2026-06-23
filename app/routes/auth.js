const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
  }

  const [rows] = await db.query(
    'SELECT id, nome, email, senha, role FROM usuarios WHERE email = ?',
    [email]
  );

  const usuario = rows[0];

  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais invalidas' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais invalidas' });
  }

  req.session.usuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role
  };

  return res.json({
    mensagem: 'Login realizado com sucesso',
    usuario: req.session.usuario
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensagem: 'Logout realizado com sucesso' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: 'Nao autenticado' });
  }

  return res.json(req.session.usuario);
});

module.exports = router;