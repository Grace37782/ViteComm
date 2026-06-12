const isDebug = () => process.env.APP_DEBUG === 'true';

export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  return isDebug() ? error.message : fallback;
}

export function internalError(error) {
  return isDebug() ? error.message : 'Une erreur interne est survenue.';
}
