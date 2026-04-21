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
