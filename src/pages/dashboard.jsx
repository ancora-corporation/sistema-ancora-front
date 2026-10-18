import { useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';

export default function Dashboard() {
  const navigate = useNavigate();

  function sair() {
    Auth.sair();
    navigate('/login');
  }

  return (
    <div className="p-4">
      <h1>Dashboard</h1>
      <button className="btn btn-outline-primary" onClick={sair}>
        Sair
      </button>
    </div>
  );
}