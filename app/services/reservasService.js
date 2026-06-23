const db = require('../db');

async function listarPublico() {
  const [rows] = await db.query(
    `SELECT id, sala_id, titulo, responsavel_nome, status, data_inicio, data_fim
     FROM reservas
     WHERE status IN ('pendente', 'ativa')
     ORDER BY data_inicio ASC`
  );
  return rows;
}

async function listarCompleto() {
  const [rows] = await db.query(
    `SELECT r.id, r.sala_id, s.nome AS sala_nome, r.usuario_id, r.responsavel_nome,
            r.titulo, r.data_inicio, r.data_fim, r.status
     FROM reservas r
     JOIN salas s ON s.id = r.sala_id
     ORDER BY r.data_inicio DESC`
  );
  return rows;
}

async function listarPorUsuario(usuarioId) {
  const [rows] = await db.query(
    `SELECT r.id, r.sala_id, s.nome AS sala_nome, r.titulo,
            r.data_inicio, r.data_fim, r.status
     FROM reservas r
     JOIN salas s ON s.id = r.sala_id
     WHERE r.usuario_id = ?
     ORDER BY r.data_inicio DESC`,
    [usuarioId]
  );
  return rows;
}

async function listarPendentes() {
  const [rows] = await db.query(
    `SELECT r.id, r.sala_id, s.nome AS sala_nome, r.responsavel_nome,
            r.titulo, r.data_inicio, r.data_fim
     FROM reservas r
     JOIN salas s ON s.id = r.sala_id
     WHERE r.status = 'pendente'
     ORDER BY r.data_inicio ASC`
  );
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    `SELECT r.id, r.sala_id, s.nome AS sala_nome, r.usuario_id, r.responsavel_nome,
            r.titulo, r.data_inicio, r.data_fim, r.status
     FROM reservas r
     JOIN salas s ON s.id = r.sala_id
     WHERE r.id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function existeConflitoSala(salaId, dataInicio, dataFim, ignorarReservaId = null) {
  const params = [salaId, dataFim, dataInicio];
  let sql = `
    SELECT id FROM reservas
    WHERE sala_id = ?
      AND status IN ('pendente', 'ativa')
      AND data_inicio < ?
      AND data_fim > ?
  `;

  if (ignorarReservaId) {
    sql += ' AND id != ?';
    params.push(ignorarReservaId);
  }

  const [rows] = await db.query(sql, params);
  return rows.length > 0;
}

async function existeConflitoUsuario(usuarioId, dataInicio, dataFim, ignorarReservaId = null) {
  if (!usuarioId) {
    return false;
  }

  const params = [usuarioId, dataFim, dataInicio];
  let sql = `
    SELECT id FROM reservas
    WHERE usuario_id = ?
      AND status IN ('pendente', 'ativa')
      AND data_inicio < ?
      AND data_fim > ?
  `;

  if (ignorarReservaId) {
    sql += ' AND id != ?';
    params.push(ignorarReservaId);
  }

  const [rows] = await db.query(sql, params);
  return rows.length > 0;
}

async function criar({ salaId, usuarioId, responsavelNome, titulo, dataInicio, dataFim }) {
  const [result] = await db.query(
    `INSERT INTO reservas (sala_id, usuario_id, responsavel_nome, titulo, data_inicio, data_fim)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [salaId, usuarioId, responsavelNome, titulo, dataInicio, dataFim]
  );

  return buscarPorId(result.insertId);
}

async function cancelar(id) {
  const [result] = await db.query(
    `UPDATE reservas SET status = 'cancelada' WHERE id = ? AND status = 'ativa'`,
    [id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return buscarPorId(id);
}

async function aprovar(id) {
  const [result] = await db.query(
    `UPDATE reservas SET status = 'ativa' WHERE id = ? AND status = 'pendente'`,
    [id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return buscarPorId(id);
}

async function rejeitar(id) {
  const [result] = await db.query(
    `UPDATE reservas SET status = 'rejeitada' WHERE id = ? AND status = 'pendente'`,
    [id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return buscarPorId(id);
}

module.exports = {
  listarPublico,
  listarCompleto,
  listarPorUsuario,
  listarPendentes,
  buscarPorId,
  existeConflitoSala,
  existeConflitoUsuario,
  criar,
  cancelar,
  aprovar,
  rejeitar
};