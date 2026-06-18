import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

/**
 * Génère un access token JWT (15 min par défaut).
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Génère un refresh token opaque (UUID) à stocker en base.
 */
export function generateRefreshToken() {
  return uuidv4()
}

/**
 * Vérifie et décode un access token.
 * Lance une erreur si expiré ou invalide.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET)
}
