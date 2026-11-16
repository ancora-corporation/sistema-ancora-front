export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos.', details: result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) });
    }
    req.validated = result.data;
    return next();
  };
}
