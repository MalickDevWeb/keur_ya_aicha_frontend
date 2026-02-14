export interface UserCreateDTO {
  id: string
  adminRequestId?: string
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  role: string
  status?: string
  createdAt?: string
}
