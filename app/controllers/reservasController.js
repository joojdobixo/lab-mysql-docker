const service = require('../services/reservasService');

async function listarPublico(req, res) {
  const reservas = await service.listarPublico();
  res.json(reservas);
}

async function listarCompleto(req, res) {
  const reservas = await service.listarCompleto();
  res.json(reservas);
}

async function minhasReservas(req, res) {
  const reservas = await service.listarPorUsuario(req.session.usuario.id);
  res.json(reservas);
}

async function buscarPorId(req, res) {
  const reserva = await service.buscarPorId(req.params.id);

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva nao encontrada' });
  }

  return res.json(reserva);
}

async function criar(req, res) {
  const { salaId, titulo, dataInicio, dataFim } = req.body;

  if (!salaId || !titulo || !dataInicio || !dataFim) {
    return res.status(400).json({
      erro: 'salaId, titulo, dataInicio e dataFim sao obrigatorios'
    });
  }

  if (new Date(dataInicio) >= new Date(dataFim)) {
    return res.status(400).json({ erro: 'dataInicio deve ser anterior a dataFim' });
  }

  const usuario = req.session.usuario;

  const conflitoSala = await service.existeConflitoSala(salaId, dataInicio, dataFim);

  if (conflitoSala) {
    return res.status(409).json({ erro: 'Sala ja reservada nesse horario' });
  }

  const conflitoUsuario = await service.existeConflitoUsuario(usuario.id, dataInicio, dataFim);

  if (conflitoUsuario) {
    return res.status(409).json({ erro: 'Voce ja possui outra reserva nesse horario' });
  }

  const reserva = await service.criar({
    salaId,
    usuarioId: usuario.id,
    responsavelNome: usuario.nome,
    titulo,
    dataInicio,
    dataFim
  });

  return res.status(201).json(reserva);
}

async function cancelar(req, res) {
  const reservaExistente = await service.buscarPorId(req.params.id);

  if (!reservaExistente) {
    return res.status(404).json({ erro: 'Reserva nao encontrada' });
  }

  const usuario = req.session.usuario;
  const ehDonoDaReserva = reservaExistente.usuario_id === usuario.id;
  const ehAdmin = usuario.role === 'admin';

  if (!ehDonoDaReserva && !ehAdmin) {
    return res.status(403).json({ erro: 'Voce so pode cancelar suas proprias reservas' });
  }

  const reserva = await service.cancelar(req.params.id);

  if (!reserva) {
    return res.status(409).json({ erro: 'Reserva ja estava cancelada' });
  }

  return res.json(reserva);
}

async function listarPendentes(req, res) {
  const reservas = await service.listarPendentes();
  res.json(reservas);
}

async function aprovar(req, res) {
  const reserva = await service.aprovar(req.params.id);

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva pendente nao encontrada' });
  }

  return res.json(reserva);
}

async function rejeitar(req, res) {
  const reserva = await service.rejeitar(req.params.id);

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva pendente nao encontrada' });
  }

  return res.json(reserva);
}

module.exports = {
  listarPublico,
  listarCompleto,
  minhasReservas,
  listarPendentes,
  buscarPorId,
  criar,
  cancelar,
  aprovar,
  rejeitar
};