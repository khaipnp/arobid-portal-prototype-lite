import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
} from "@/lib/administration/types"

export const adminModules: AdminModule[] = [
  {
    id: "module-b2b",
    code: "B2B_MARKETPLACE",
    name: "B2B Marketplace",
    description: "Core trading and supplier management features.",
  },
  {
    id: "module-tradexpo",
    code: "TRADEXPO",
    name: "TradeXpo",
    description: "Expo and booth management capabilities.",
  },
]

export const adminRoles: AdminRole[] = [
  {
    id: "role-buyer",
    name: "BUYER",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    description: "Can discover and place orders for products.",
  },
  {
    id: "role-seller",
    name: "SELLER",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    description: "Can create and manage products and quotations.",
  },
  {
    id: "role-expo-owner",
    name: "EXPO_OWNER",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    description: "Can create and operate expo events.",
  },
  {
    id: "role-exhibitor",
    name: "EXHIBITOR",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    description: "Can participate in expo and manage booths.",
  },
]

export const adminFeatures: AdminFeature[] = [
  {
    id: "feature-order-management",
    name: "Order Management",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    description: "Track, review, and process platform orders.",
  },
  {
    id: "feature-catalog",
    name: "Catalog",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    description: "Manage product catalog entries and categories.",
  },
  {
    id: "feature-expo-list",
    name: "Expo List",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    description: "Create and administer expo records.",
  },
  {
    id: "feature-booth-template",
    name: "Booth Templates",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    description: "Configure reusable 3D booth templates.",
  },
]

export const adminPermissions: AdminPermission[] = [
  {
    id: "order-read",
    name: "Read Orders",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    roleId: "role-buyer",
    roleName: "BUYER",
    featureId: "feature-order-management",
    featureName: "Order Management",
    action: "read",
  },
  {
    id: "order-create",
    name: "Create Orders",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    roleId: "role-buyer",
    roleName: "BUYER",
    featureId: "feature-order-management",
    featureName: "Order Management",
    action: "create",
  },
  {
    id: "catalog-edit",
    name: "Edit Catalog",
    moduleId: "module-b2b",
    moduleName: "B2B Marketplace",
    roleId: "role-seller",
    roleName: "SELLER",
    featureId: "feature-catalog",
    featureName: "Catalog",
    action: "update",
  },
  {
    id: "expo-read",
    name: "Read Expo",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    roleId: "role-expo-owner",
    roleName: "EXPO_OWNER",
    featureId: "feature-expo-list",
    featureName: "Expo List",
    action: "read",
  },
  {
    id: "expo-create",
    name: "Create Expo",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    roleId: "role-expo-owner",
    roleName: "EXPO_OWNER",
    featureId: "feature-expo-list",
    featureName: "Expo List",
    action: "create",
  },
  {
    id: "booth-read",
    name: "Read Booth Templates",
    moduleId: "module-tradexpo",
    moduleName: "TradeXpo",
    roleId: "role-exhibitor",
    roleName: "EXHIBITOR",
    featureId: "feature-booth-template",
    featureName: "Booth Templates",
    action: "read",
  },
]
