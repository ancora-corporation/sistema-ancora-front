export const Auth = {
  async login(email, senha) {
    // TODO: trocar por fetch(`${import.meta.env.VITE_API_URL}/auth/login`, { method: 'POST', ... })
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (email === 'admin@ancora.com' && senha === '123456') {
      return { token: 'token-de-teste' };
    }
    throw new Error('Credenciais inválidas');
  },

  salvarToken(token) {
    localStorage.setItem('token', token);
  },

  estaLogado() {
    return Boolean(localStorage.getItem('token'));
  },

  sair() {
    localStorage.removeItem('token');
  },
};