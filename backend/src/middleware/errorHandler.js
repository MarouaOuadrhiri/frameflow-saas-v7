// Central error handler. Always responds with { error: { message } }.
const errorHandler = (err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);

  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Map common MySQL errors to client-friendly statuses.
  if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'This record already exists';
  } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || err.code === 'ER_BAD_FIELD_ERROR') {
    status = 400;
    message = 'Invalid value for one of the fields';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 400;
    message = 'Related record not found';
  }

  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  res.status(status).json({ error: { message } });
};

module.exports = errorHandler;
