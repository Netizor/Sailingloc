/**
 * Règles de validation partagées (email, mot de passe).
 * Utilisées à l'inscription (auth.routes.js), à la réinitialisation de mot de passe
 * (auth.routes.js) et au changement de mot de passe (users.routes.js), afin de garantir
 * une seule et même politique de sécurité aux trois endroits.
 */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Retourne null si le mot de passe est valide, sinon le message d'erreur à renvoyer. */
export function validatePassword(password) {
  if (!password || password.length < 12 || password.length > 128) {
    return 'Le mot de passe doit contenir entre 12 et 128 caractères'
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
  }
  return null
}
