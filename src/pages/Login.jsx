import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import iconeAncora from '../assets/icone-sistema.png';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [validado, setValidado] = useState(false);

  if (Auth.estaLogado()) {
    return <Navigate to={Auth.rotaInicial()} replace />;
  }

  async function entrar(evento) {
    evento.preventDefault();
    setErro('');

    if (!evento.currentTarget.checkValidity()) {
      setValidado(true);
      return;
    }

    setCarregando(true);
    try {
      const resposta = await Auth.login(email.trim(), senha);
      Auth.salvarSessao(resposta);
      navigate(Auth.rotaInicial());
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card card-login shadow border-0 p-4">
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <img
            src={iconeAncora}
            alt=""
            className="logo-icone"
            width={100}
            height={100}
          />
          <div className="text-start">
            <div className="logo-sistema">SISTEMA</div>
            <div className="logo-ancora">ÂNCORA</div>
          </div>
        </div>

        <form
          onSubmit={entrar}
          noValidate
          className={validado ? 'was-validated' : ''}
        >
          <div className="mb-3">
            <label htmlFor="email" className="form-label fs-5">Login:</label>
            <input
              id="email"
              type="email"
              className="form-control form-control-lg rounded-pill campo-ancora"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="invalid-feedback">Informe um e-mail válido.</div>
          </div>

          <div className="mb-3">
            <label htmlFor="senha" className="form-label fs-5">Senha:</label>
            <input
              id="senha"
              type="password"
              className="form-control form-control-lg rounded-pill campo-ancora"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
            <div className="invalid-feedback">
              A senha precisa ter ao menos 6 caracteres.
            </div>
          </div>

          {erro && (
            <div className="alert alert-danger py-2" role="alert">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg rounded-pill w-100 py-3 fw-bold"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}