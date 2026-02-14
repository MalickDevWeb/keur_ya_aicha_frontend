import type { FieldValues, UseFormSetError } from 'react-hook-form'

type FieldErrorMatcher = {
  field: string
  match: (message: string) => boolean
}

const DEFAULT_MATCHERS: FieldErrorMatcher[] = [
  { field: 'phone', match: (m) => m.includes('numéro') || m.includes('téléphone') || m.includes('telephone') },
  { field: 'email', match: (m) => m.includes('email') || m.includes('e-mail') },
  { field: 'password', match: (m) => m.includes('mot de passe') || m.includes('password') },
  { field: 'confirmPassword', match: (m) => m.includes('confirmation') || m.includes('confirmer') },
  { field: 'username', match: (m) => m.includes('utilisateur') || m.includes("nom d'utilisateur") || m.includes('username') },
  { field: 'entrepriseName', match: (m) => m.includes('entreprise') },
  { field: 'name', match: (m) => m.includes('nom') },
]

export function applyApiFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  rawMessage: string,
  matchers: FieldErrorMatcher[] = DEFAULT_MATCHERS
): boolean {
  if (!rawMessage) return false
  const message = rawMessage.toLowerCase()
  const match = matchers.find((m) => m.match(message))
  if (!match) return false
  setError(match.field as keyof T, { type: 'server', message: rawMessage })
  return true
}
