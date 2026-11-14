import { Link } from 'react-router-dom';
import CartaoIndicador from '../../components/CartaoIndicador';
import { alertasExemplo } from '../../data/alertasExemplo';
import { usuariosExemplo } from '../../data/usuariosExemplo';

// VALORES FICTÍCIOS, só para montar a tela.
// Quando a API existir, estes números passam a vir dela.
const indicadores = {
  alertasAbertos: 9,
  alertasTotal: 12,
  escolasAResponder: 5,
  escolasEmAtraso: 3,
  evasaoPercentual: '4,2%',
  evasaoReferencia: 'setembro de 2026',
};

const atalhos = [
  { to: '/admin/alertas', icone: 'bi-bell', titulo: 'Alertas', texto: 'Todos os alertas e seus prazos' },
  { to: '/admin/escolas', icone: 'bi-building', titulo: 'Escolas', texto: 'Relatórios e perfil de cada escola' },
  { to: '/admin/usuarios', icone: 'bi-people', titulo: 'Usuários', texto: 'Perfis, contatos e escola vinculada' },
  { to: '/admin/contas', icone: 'bi-person-gear', titulo: 'Contas', texto: 'Editar, redefinir e desativar acessos' },
];

export default function PainelRede() {
  function gerarRelatorio() {
    const linhas = [
      ['Escola', 'Código', 'Alunos cadastrados', 'Profissionais', 'Alertas em aberto', 'Alertas em atraso'],
      ...[...new Map(usuariosExemplo.filter((usuario) => usuario.escolaId).map((usuario) => [usuario.escolaId, usuario.escola])).entries()].map(([id, escola]) => {
        const alertas = alertasExemplo.filter((alerta) => alerta.escola === escola);
        return [escola, `EM-${String(id).padStart(3, '0')}`, '—', usuariosExemplo.filter((usuario) => usuario.escolaId === id).length, alertas.filter((alerta) => ['novo', 'em_andamento'].includes(alerta.status)).length, alertas.filter((alerta) => alerta.status === 'em_atraso').length];
      }),
    ];
    const csv = `\uFEFF${linhas.map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-rede-ancora.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h2 mb-0">Painel da Rede</h1>
        <button type="button" className="btn btn-primary" onClick={gerarRelatorio}>
          <i className="bi bi-download me-2" aria-hidden="true"></i>
          Gerar relatório da rede (CSV)
        </button>
      </div>

      <div className="row g-3 mb-5">
        <div className="col-12 col-md-6 col-xl-3">
          <CartaoIndicador
            titulo="Alertas em aberto"
            valor={indicadores.alertasAbertos}
            detalhe={`de ${indicadores.alertasTotal} no total`}
            to="/admin/alertas"
          />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <CartaoIndicador
            titulo="Escolas com alertas a responder"
            valor={indicadores.escolasAResponder}
            detalhe="Prazo ainda em dia"
            to="/admin/escolas?alertas=a-responder"
          />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <CartaoIndicador
            titulo="Escolas com alertas em atraso"
            valor={indicadores.escolasEmAtraso}
            detalhe="Prazo de 7 dias vencido"
            to="/admin/escolas?alertas=em-atraso"
            variante="danger"
          />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <CartaoIndicador
            titulo="Evasão da rede"
            valor={indicadores.evasaoPercentual}
            detalhe={`Atualizado mensalmente (ref. ${indicadores.evasaoReferencia})`}
          />
        </div>
      </div>

      <h2 className="h5 mb-3">Acesso rápido</h2>
      <div className="row g-3">
        {atalhos.map((a) => (
          <div key={a.to} className="col-6 col-lg-3">
            <Link
              to={a.to}
              className="card h-100 border-0 shadow-sm text-decoration-none text-body text-center p-3 cartao-clicavel"
            >
              <i className={`bi ${a.icone} display-5 text-primary`} aria-hidden="true"></i>
              <div className="fw-bold mt-2">{a.titulo}</div>
              <div className="small text-body-secondary">{a.texto}</div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
