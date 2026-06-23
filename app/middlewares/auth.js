function exigirLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: 'Acesso nao autorizado' });
  }

  return next();
}

function exigirAdmin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: 'Acesso nao autorizado' });
  }

  if (req.session.usuario.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' });
  }

  return next();
}

module.exports = { exigirLogin, exigirAdmin };