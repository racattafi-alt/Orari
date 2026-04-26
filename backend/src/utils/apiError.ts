export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(msg: string, code?: string) { return new ApiError(400, msg, code); }
  static unauthorized(msg = 'Non autorizzato') { return new ApiError(401, msg, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Accesso negato') { return new ApiError(403, msg, 'FORBIDDEN'); }
  static notFound(msg = 'Risorsa non trovata') { return new ApiError(404, msg, 'NOT_FOUND'); }
  static conflict(msg: string) { return new ApiError(409, msg, 'CONFLICT'); }
  static internal(msg = 'Errore interno del server') { return new ApiError(500, msg, 'INTERNAL'); }
}
