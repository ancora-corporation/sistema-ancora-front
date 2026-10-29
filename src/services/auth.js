export const Auth = {
  async login(email, senha) {
    // TODO: trocar por fetch(`${import.meta.env.VITE_API_URL}/auth/login`, { method: 'POST', ... })
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (email === 'admin@ancora.com' && senha === '123456') {
      return {
         token: 'token-de-teste',
         usuario: {nome: 'Administrador', nivel: 3}, 
        };
      
    }
    throw new Error('Credenciais inválidas');
  },

  salvarSessao({token, usuario}) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },

  usuarioAtual () {
    try {
      return JSON.parse(localStorage.getItem('usuario'))
  } catch {
    return null;
  }
  },

  estaLogado() {
    // Só vale como logado quem tem Token e dados do usuário (com nível1)
    return Boolean(localStorage.getItem('token') && Auth.usuarioAtual());
  },

  rotaInicial() {
    const usuario = Auth.usuarioAtual();
    return usuario?.nivel === 3 ? '/admin' : '/dashboard';
  },

  sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};