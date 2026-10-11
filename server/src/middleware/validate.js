// Validates req.body / req.query / req.params against a Zod schema and replaces them with parsed data.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err);
  }
};
