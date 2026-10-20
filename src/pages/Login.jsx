import { useState } from "react";
import Logo from "../components/Logo";

export default function Login() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!login || !senha) {
      setErro("Preencha o login e a senha.");
      return;
    }

    setErro("");
    console.log("Tentativa de login com:", login);
    // Na próxima etapa: validar usuário e redirecionar por perfil
  }

  return (
    <div className="container py-4" style={{ maxWidth: "460px", minHeight: "100vh" }}>
      <div className="mb-5">
        <Logo />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 pt-5">
        <label htmlFor="login" className="form-label fs-5">
          Login:
        </label>
        <input
          id="login"
          type="text"
          className="form-control form-control-lg rounded-pill campo-ancora mb-4"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="senha" className="form-label fs-5">
          Senha:
        </label>
        <input
          id="senha"
          type="password"
          className="form-control form-control-lg rounded-pill campo-ancora mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />

        {erro && (
          <div className="alert alert-danger py-2" role="alert">
            {erro}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg rounded-pill w-100 py-3 mt-2 fw-bold">
          Entrar
        </button>
      </form>
    </div>
  );
}