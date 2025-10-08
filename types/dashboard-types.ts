// types/dashboard-types.ts
export interface DashboardStats {
  totalAssets: number;
  totalAssetsChange: number;
  activeEmployees: number;
  activeEmployeesChange: number;
  activeDeployments: number;
  activeDeploymentsChange: number;
  pendingApprovals: number;
  pendingApprovalsChange: number;
  maintenanceAlerts: number;
  lowStockItems: number;
  reportsGenerated: number;
  reportsChange: number;
}

export interface RecentDeployment {
  id: string;
  assetDescription: string;
  employeeName: string;
  deployedDate: Date;
  status: 'DEPLOYED' | 'PENDING_ACCOUNTING_APPROVAL' | 'RETURNED';
}

export interface SystemAlert {
  id: string;
  type: 'MAINTENANCE_DUE' | 'LOW_STOCK' | 'APPROVAL_PENDING' | 'WARRANTY_EXPIRY';
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  relatedId?: string;
}

export interface AssetByCategoryChart {
  category: string;
  count: number;
  percentage: number;
}

export interface DeploymentTrendChart {
  month: string;
  deployments: number;
  returns: number;
}

export interface TopAssetsChart {
  description: string;
  deploymentCount: number;
  category: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentDeployments: RecentDeployment[];
  systemAlerts: SystemAlert[];
  assetsByCategory: AssetByCategoryChart[];
  deploymentTrends: DeploymentTrendChart[];
  topAssets: TopAssetsChart[];
}