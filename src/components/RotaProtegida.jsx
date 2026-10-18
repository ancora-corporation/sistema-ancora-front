import { Navigate } from 'react-router-dom';
import { Auth } from '../services/auth';

export default function RotaProtegida({ children }) {
  if (!Auth.estaLogado()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}