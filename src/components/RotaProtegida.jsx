import { Navigate } from 'react-router-dom';
import { Auth } from '../services/auth';

export default function RotaProtegida({ niveis, children }) {
  if (!Auth.estaLogado()) {
    return <Navigate to="/login" replace />;
  }

  const usuario = Auth.usuarioAtual();

  // Logado, mas sem permissão para esta área
  // Vai para a tela inicial do próprio nível
  
  if (niveis && !niveis.includes(usuario.nivel)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}