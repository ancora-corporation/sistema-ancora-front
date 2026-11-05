const NIVEIS = {
  alto: { rotulo: 'Alto', classe: 'text-bg-danger' },
  medio: { rotulo: 'Médio', classe: 'text-bg-warning' },
  baixo: { rotulo: 'Baixo', classe: 'text-bg-secondary' },
};

const STATUS = {
  novo: { rotulo: 'Novo', classe: 'text-bg-primary' },
  em_andamento: { rotulo: 'Em andamento', classe: 'text-bg-info' },
  concluido: { rotulo: 'Concluído', classe: 'text-bg-success' },
  em_atraso: { rotulo: 'Em atraso', classe: 'text-bg-danger' },
};

export function EtiquetaNivel({ nivel }) {
  const item = NIVEIS[nivel];
  return <span className={`badge ${item.classe}`}>{item.rotulo}</span>;
}

export function EtiquetaStatus({ status }) {
  const item = STATUS[status];
  return <span className={`badge ${item.classe}`}>{item.rotulo}</span>;
}

export function TextoPrazo({ dias }) {
  if (dias === null) {
    return <span className="text-body-secondary">-</span>;
  }
  if (dias < 0) {
    const atraso = Math.abs(dias);
    return (
      <span className="text-danger fw-bold">
        {atraso} {atraso === 1 ? 'dia' : 'dias'} em atraso
      </span>
    );
  }
  if (dias === 0) {
    return <span className="fw-bold">Vence hoje</span>;
  }
  return <span>{dias} {dias === 1 ? 'dia' : 'dias'}</span>;
}