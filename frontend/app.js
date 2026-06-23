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
  } else {
    authPanel.classList.remove('oculto');
    usuarioLogadoPanel.classList.add('oculto');
    reservaPanel.classList.add('oculto');
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
      .map((reserva) => `${formatarData(reserva.data_inicio)} - ${formatarData(reserva.data_fim)}`)
      .join('<br />') || 'Sem reservas futuras';

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

async function carregarSalasEReservas() {
  await Promise.all([carregarSalas(), carregarReservasPublicas()]);
  renderizarSalas();
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

  mostrarMensagem(reservaMensagem, 'Reserva confirmada com sucesso');
  reservaForm.reset();
  reservaPanel.classList.add('oculto');
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

verificarSessao().then(carregarSalasEReservas);