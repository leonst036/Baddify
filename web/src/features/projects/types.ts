export interface EnvVariable {
  key: string
  value: string
  isSecret?: boolean
}

export interface ProjectEnvironment {
  id: string
  uuid?: string
  name: string
  updatedAt: string
  variables: EnvVariable[]
  description: string
}

export interface ProjectItem {
  id: string
  uuid?: string
  user_uuid?: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}
