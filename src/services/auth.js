import { apiRequest } from './api';

export const Auth = {
  async login(email, senha) {
    return apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: email.trim(), senha }),
    });
  },

  salvarSessao({token, usuario}) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },

  atualizarUsuario(dados) {
    const usuario = { ...Auth.usuarioAtual(), ...dados };
    localStorage.setItem('usuario', JSON.stringify(usuario));
    return usuario;
  },

  usuarioAtual () {
    try {
      return JSON.parse(localStorage.getItem('usuario'))
  } catch {
    return null;
  }
  },

  estaLogado() {
    const token = localStorage.getItem('token');
    return Boolean(token?.split('.').length === 3 && Auth.usuarioAtual());
  },

  rotaInicial() {
    const usuario = Auth.usuarioAtual();
    if (usuario?.nivel === 3) return '/admin';
    if (usuario?.nivel === 4) return '/professor';
    if (usuario?.nivel === 1) return '/painel-alunos';
    if (usuario?.nivel === 2) return '/painel-escola';
    return '/dashboard';
  },

  sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};
