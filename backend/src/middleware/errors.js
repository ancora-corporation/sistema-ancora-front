export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso não encontrado.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  res.status(error.status || 500).json({
    error: error.status && error.status < 500 ? error.message : 'Erro interno do servidor.',
  });
}
