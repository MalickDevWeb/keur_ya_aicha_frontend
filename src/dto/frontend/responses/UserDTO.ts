export interface AuthUser {
  id: string
  username: string
  name: string
  email: string
  role: string
  status?: string
}

export interface UserDTO extends AuthUser {
  phone?: string
}
