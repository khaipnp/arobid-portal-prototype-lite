export interface AdminModule {
  id: string
  name: string
  code: string
  description: string
}

export interface AdminRole {
  id: string
  name: string
  moduleId: string
  moduleName: string
  description: string
}

export interface AdminFeature {
  id: string
  name: string
  moduleId: string
  moduleName: string
  description: string
}

export interface AdminPermission {
  id: string
  name: string
  moduleId: string
  moduleName: string
  roleId: string
  roleName: string
  featureId: string
  featureName: string
  action: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  companyName: string | null
  companyLogoUrl: string | null
  roleCount: number
  isActive: boolean
}

export interface AdminCompany {
  id: string
  name: string
  taxId: string | null
  logoUrl: string | null
  website: string | null
  address: string | null
  categoryNames: string[]
  isActive: boolean
}

export interface CompanyCategoryOption {
  id: string
  name: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}
