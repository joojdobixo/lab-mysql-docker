const API_URL = 'http://localhost:3000';

// --- elementos: auth (login/cadastro com tabs) ---
const authPanel = document.getElementById('auth-panel');
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginSenha = document.getElementById('login-senha');
const loginMensagem = document.getElementById('login-mensagem');

const cadastroForm = document.getElementById('cadastro-form');
const cadastroNome = document.getElementById('cadastro-nome');
const cadastroEmail = document.getElementById('cadastro-email');
const cadastroSenha = document.getElementById('cadastro-senha');
const cadastroMensagem = document.getElementById('cadastro-mensagem');

// --- elementos: sessao ---
const usuarioLogadoPanel = document.getElementById('usuario-logado-panel');
const usuarioLogadoInfo = document.getElementById('usuario-logado-info');
const logoutBtn = document.getElementById('logout-btn');

// --- elementos: salas ---
const salasTabela = document.getElementById('salas-tabela');

// --- elementos: reserva ---
const reservaPanel = document.getElementById('reserva-panel');
const reservaForm = document.getElementById('reserva-form');
const reservaSalaId = document.getElementById('reserva-sala-id');
const reservaSalaNome = document.getElementById('reserva-sala-nome');
const reservaTitulo = document.getElementById('reserva-titulo');
const reservaInicio = document.getElementById('reserva-inicio');
const reservaFim = document.getElementById('reserva-fim');
const reservaMensagem = document.getElementById('reserva-mensagem');
const cancelarReservaBtn = document.getElementById('cancelar-reserva-btn');

// --- elementos: admin ---
const adminPanel = document.getElementById('admin-panel');
const pendentesTabela = document.getElementById('pendentes-tabela');
const pendentesVazio = document.getElementById('pendentes-vazio');

// --- elementos: admin (CRUD de salas) ---
const salaForm = document.getElementById('sala-form');
const salaIdInput = document.getElementById('sala-id');
const salaNomeInput = document.getElementById('sala-nome');
const salaCapacidadeInput = document.getElementById('sala-capacidade');
const salaDescricaoInput = document.getElementById('sala-descricao');
const salaRecursosInput = document.getElementById('sala-recursos');
const salaSubmitBtn = document.getElementById('sala-submit-btn');
const salaCancelarBtn = document.getElementById('sala-cancelar-btn');
const salaMensagem = document.getElementById('sala-mensagem');
const adminSalasTabela = document.getElementById('admin-salas-tabela');

let usuarioAtual = null;
let salasCache = [];
let reservasCache = [];

function mostrarMensagem(elemento, texto, erro = false) {
  elemento.textContent = texto;
  elemento.style.color = erro ? '#B42318' : '#1F5F5B';
}

function formatarData(dataString) {
  const data = new Date(dataString.replace(' ', 'T'));
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function alternarTab(nomeTab) {
  tabButtons.forEach((botao) => {
    const ativo = botao.dataset.tab === nomeTab;
    botao.classList.toggle('is-active', ativo);
    botao.setAttribute('aria-selected', ativo ? 'true' : 'false');
  });

  tabContents.forEach((conteudo) => {
    conteudo.classList.toggle('is-active', conteudo.dataset.tabContent === nomeTab);
  });
}

function atualizarUiSessao() {
  if (usuarioAtual) {
    authPanel.classList.add('oculto');
    usuarioLogadoPanel.classList.remove('oculto');
    usuarioLogadoInfo.textContent = `Logado como ${usuarioAtual.nome} (${usuarioAtual.role})`;

    if (usuarioAtual.role === 'admin') {
      adminPanel.classList.remove('oculto');
      carregarPendentes();
    } else {
      adminPanel.classList.add('oculto');
    }
  } else {
    authPanel.classList.remove('oculto');
    usuarioLogadoPanel.classList.add('oculto');
    reservaPanel.classList.add('oculto');
    adminPanel.classList.add('oculto');
  }
}

async function verificarSessao() {
  const resposta = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });

  if (resposta.ok) {
    usuarioAtual = await resposta.json();
  } else {
    usuarioAtual = null;
  }

  atualizarUiSessao();
}

async function fazerLogin(event) {
  event.preventDefault();

  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: loginEmail.value.trim(),
      senha: loginSenha.value
    })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(loginMensagem, dados.erro || 'Falha no login', true);
    return;
  }

  usuarioAtual = dados.usuario;
  mostrarMensagem(loginMensagem, '');
  loginForm.reset();
  atualizarUiSessao();
  carregarSalasEReservas();
}

async function criarConta(event) {
  event.preventDefault();

  const resposta = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: cadastroNome.value.trim(),
      email: cadastroEmail.value.trim(),
      senha: cadastroSenha.value
    })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(cadastroMensagem, dados.erro || 'Falha ao criar conta', true);
    return;
  }

  mostrarMensagem(cadastroMensagem, 'Conta criada com sucesso. Faça login.');
  cadastroForm.reset();
  alternarTab('login');
}

async function fazerLogout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  usuarioAtual = null;
  atualizarUiSessao();
}

async function carregarSalas() {
  const resposta = await fetch(`${API_URL}/salas`);
  salasCache = await resposta.json();
}

async function carregarReservasPublicas() {
  const resposta = await fetch(`${API_URL}/reservas`);
  reservasCache = await resposta.json();
}

function renderizarSalas() {
  salasTabela.innerHTML = '';

  salasCache.forEach((sala) => {
    const ocupacoes = reservasCache
      .filter((reserva) => reserva.sala_id === sala.id)
      .map((reserva) => {
        const badgeClasse = reserva.status === 'pendente' ? 'badge-pendente' : 'badge-ativa';
        const badgeTexto = reserva.status === 'pendente' ? 'Pendente' : 'Confirmada';

        return `
          <div class="ocupacao-item">
            ${formatarData(reserva.data_inicio)} - ${formatarData(reserva.data_fim)}
            <span class="badge ${badgeClasse}">${badgeTexto}</span><br />
            <small>Responsável: ${reserva.responsavel_nome}</small>
          </div>
        `;
      })
      .join('') || 'Sem reservas futuras';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sala.nome}</td>
      <td>${sala.capacidade}</td>
      <td>${sala.recursos || '-'}</td>
      <td>${ocupacoes}</td>
      <td>
        <button class="acao" data-reservar="${sala.id}" data-nome="${sala.nome}">
          Reservar
        </button>
      </td>
    `;

    salasTabela.appendChild(tr);
  });
}

function renderizarAdminSalas() {
  adminSalasTabela.innerHTML = '';

  salasCache.forEach((sala) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sala.nome}</td>
      <td>${sala.capacidade}</td>
      <td>${sala.recursos || '-'}</td>
      <td>
        <button class="acao" data-editar="${sala.id}">Editar</button>
        <button class="acao acao-excluir" data-excluir="${sala.id}">Excluir</button>
      </td>
    `;

    adminSalasTabela.appendChild(tr);
  });
}

async function carregarSalasEReservas() {
  await Promise.all([carregarSalas(), carregarReservasPublicas()]);
  renderizarSalas();

  if (usuarioAtual && usuarioAtual.role === 'admin') {
    renderizarAdminSalas();
  }
}

function abrirFormularioReserva(salaId, salaNome) {
  if (!usuarioAtual) {
    mostrarMensagem(loginMensagem, 'Faça login para reservar uma sala', true);
    return;
  }

  reservaSalaId.value = salaId;
  reservaSalaNome.textContent = `Sala selecionada: ${salaNome}`;
  reservaPanel.classList.remove('oculto');
  reservaPanel.scrollIntoView({ behavior: 'smooth' });
}

async function confirmarReserva(event) {
  event.preventDefault();

  const payload = {
    salaId: Number(reservaSalaId.value),
    titulo: reservaTitulo.value.trim(),
    dataInicio: reservaInicio.value,
    dataFim: reservaFim.value
  };

  const resposta = await fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(reservaMensagem, dados.erro || 'Falha ao reservar', true);
    return;
  }

  mostrarMensagem(reservaMensagem, 'Solicitação enviada. Aguardando aprovação do administrador.');
  reservaForm.reset();
  reservaPanel.classList.add('oculto');
  carregarSalasEReservas();
}

async function carregarPendentes() {
  const resposta = await fetch(`${API_URL}/reservas/pendentes`, { credentials: 'include' });

  if (!resposta.ok) {
    return;
  }

  const pendentes = await resposta.json();
  renderizarPendentes(pendentes);
}

function renderizarPendentes(pendentes) {
  pendentesTabela.innerHTML = '';

  if (pendentes.length === 0) {
    pendentesVazio.classList.remove('oculto');
    return;
  }

  pendentesVazio.classList.add('oculto');

  pendentes.forEach((reserva) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${reserva.sala_nome}</td>
      <td>${reserva.responsavel_nome}</td>
      <td>${reserva.titulo}</td>
      <td>${formatarData(reserva.data_inicio)} - ${formatarData(reserva.data_fim)}</td>
      <td>
        <button class="acao acao-aprovar" data-aprovar="${reserva.id}">Aprovar</button>
        <button class="acao acao-rejeitar" data-rejeitar="${reserva.id}">Rejeitar</button>
      </td>
    `;

    pendentesTabela.appendChild(tr);
  });
}

async function aprovarReserva(id) {
  await fetch(`${API_URL}/reservas/${id}/aprovar`, {
    method: 'POST',
    credentials: 'include'
  });

  carregarPendentes();
  carregarSalasEReservas();
}

async function rejeitarReserva(id) {
  await fetch(`${API_URL}/reservas/${id}/rejeitar`, {
    method: 'POST',
    credentials: 'include'
  });

  carregarPendentes();
  carregarSalasEReservas();
}

function preencherFormularioSala(sala) {
  salaIdInput.value = sala.id;
  salaNomeInput.value = sala.nome;
  salaCapacidadeInput.value = sala.capacidade;
  salaDescricaoInput.value = sala.descricao || '';
  salaRecursosInput.value = sala.recursos || '';
  salaSubmitBtn.textContent = 'Salvar alterações';
  salaCancelarBtn.classList.remove('oculto');
}

function limparFormularioSala() {
  salaForm.reset();
  salaIdInput.value = '';
  salaSubmitBtn.textContent = 'Criar sala';
  salaCancelarBtn.classList.add('oculto');
  mostrarMensagem(salaMensagem, '');
}

async function salvarSala(event) {
  event.preventDefault();

  const id = salaIdInput.value;
  const payload = {
    nome: salaNomeInput.value.trim(),
    capacidade: Number(salaCapacidadeInput.value),
    descricao: salaDescricaoInput.value.trim(),
    recursos: salaRecursosInput.value.trim()
  };

  const url = id ? `${API_URL}/salas/${id}` : `${API_URL}/salas`;
  const method = id ? 'PUT' : 'POST';

  const resposta = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(salaMensagem, dados.erro || 'Falha ao salvar sala', true);
    return;
  }

  mostrarMensagem(salaMensagem, id ? 'Sala atualizada com sucesso' : 'Sala criada com sucesso');
  limparFormularioSala();
  carregarSalasEReservas();
}

async function excluirSala(id) {
  const confirmou = confirm('Excluir esta sala também remove todas as reservas associadas a ela. Continuar?');

  if (!confirmou) {
    return;
  }

  await fetch(`${API_URL}/salas/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  carregarSalasEReservas();
}

tabButtons.forEach((botao) => {
  botao.addEventListener('click', () => alternarTab(botao.dataset.tab));
});

loginForm.addEventListener('submit', fazerLogin);
cadastroForm.addEventListener('submit', criarConta);
logoutBtn.addEventListener('click', fazerLogout);
reservaForm.addEventListener('submit', confirmarReserva);

cancelarReservaBtn.addEventListener('click', () => {
  reservaForm.reset();
  reservaPanel.classList.add('oculto');
});

salasTabela.addEventListener('click', (event) => {
  const salaId = event.target.getAttribute('data-reservar');
  const salaNome = event.target.getAttribute('data-nome');

  if (salaId) {
    abrirFormularioReserva(salaId, salaNome);
  }
});

pendentesTabela.addEventListener('click', (event) => {
  const aprovarId = event.target.getAttribute('data-aprovar');
  const rejeitarId = event.target.getAttribute('data-rejeitar');

  if (aprovarId) {
    aprovarReserva(aprovarId);
  }

  if (rejeitarId) {
    rejeitarReserva(rejeitarId);
  }
});

salaForm.addEventListener('submit', salvarSala);

salaCancelarBtn.addEventListener('click', () => {
  limparFormularioSala();
});

adminSalasTabela.addEventListener('click', (event) => {
  const editarId = event.target.getAttribute('data-editar');
  const excluirId = event.target.getAttribute('data-excluir');

  if (editarId) {
    const sala = salasCache.find((s) => String(s.id) === editarId);

    if (sala) {
      preencherFormularioSala(sala);
    }
  }

  if (excluirId) {
    excluirSala(excluirId);
  }
});

verificarSessao().then(carregarSalasEReservas);