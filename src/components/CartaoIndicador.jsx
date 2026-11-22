import { Link } from 'react-router-dom';

export default function CartaoIndicador({ titulo, valor, detalhe, to, variante }) {
  const classeValor = variante ? `text-${variante}` : '';

  const conteudo = (
    <div className="card-body">
      <div className="small text-body-secondary">{titulo}</div>
      <div className={`display-5 fw-bold ${classeValor}`}>{valor}</div>
      {detalhe && <div className="small text-body-secondary">{detalhe}</div>}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="card h-100 border-0 shadow-sm text-decoration-none text-body cartao-clicavel"
      >
        {conteudo}
      </Link>
    );
  }

  return <div className="card h-100 border-0 shadow-sm">{conteudo}</div>;
}