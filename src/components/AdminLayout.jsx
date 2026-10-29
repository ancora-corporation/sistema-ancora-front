import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import logo from '../assets/logo_sistema_ancora.svg';

const links = [
    { to: '/admin', rotulo: 'Painel', exato: true },
    { to: '/admin/alertas', rotulo: 'Alertas' },
    { to: '/admin/escolas', rotulo: 'Escolas' },
    { to: '/admin/usuarios', rotulo: 'Usuários' },
    { to: 'admin/contas', rotulo:'Contas' },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const usuario = Auth.usuarioAtual();

    function sair() {
        Auth.sair();
        navigate('/login')
    }
    return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-2">
          <img src={logo} alt="Sistema Âncora" height={80} />

          <nav className="nav nav-pills">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.exato}
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              >
                {l.rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="d-flex align-items-center gap-2">
            <span className="small">{usuario?.nome}</span>
            <button className="btn btn-outline-primary btn-sm" onClick={sair}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}