export const Auth = {
  async login(email, senha) {
    // TODO: trocar por fetch(`${import.meta.env.VITE_API_URL}/auth/login`, { method: 'POST', ... })
    await new Promise((resolve) => setTimeout(resolve, 600));

    let contasInativas = [];
    try { contasInativas = JSON.parse(localStorage.getItem('ancora-contas-inativas') || '[]'); } catch { /* usa a lista vazia */ }

    if (email === 'admin@ancora.com' && senha === '123456' && !contasInativas.includes(1)) {
      return {
         token: 'token-de-teste',
         usuario: {nome: 'Administrador', nivel: 3}, 
        };
      
    }
    if (email === 'professor@ancora.com' && senha === '123456' && !contasInativas.includes(13)) {
      return {
        token: 'token-professor-demo',
        usuario: { nome: 'Professora Exemplo', email, nivel: 4, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
      };
    }
    if (email === 'social@ancora.com' && senha === '123456' && !contasInativas.includes(14)) {
      return {
        token: 'token-social-demo',
        usuario: { nome: 'Assistente Social Exemplo', email, nivel: 1, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
      };
    }
    if (email === 'diretor@ancora.com' && senha === '123456' && !contasInativas.includes(15)) {
      return {
        token: 'token-diretor-demo',
        usuario: { nome: 'Diretor Exemplo', email, nivel: 2, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
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
