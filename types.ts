export interface Alert {
  id: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
}

export interface FileData {
  file_name: string;
  size: number; // in MB
  access_count: number;
  last_access_days: number;
  recency_score?: number;
  frequency_score?: number;
  consistency_score?: number;
  storage_priority_score?: number;
  tier?: 'HOT' | 'WARM' | 'COLD';
  prediction?: 'HIGH' | 'MEDIUM' | 'LOW';
  current_cost?: number;
  optimized_cost?: number;
  next_expected_access_time?: number; // in days
  suggested_action?: string;
  scheduling_enabled?: boolean;
  was_moved_by_scheduler?: boolean;
  overrideTier?: 'AUTO' | 'HOT' | 'WARM' | 'COLD';
  isWaste?: boolean;
}

export interface AppSettings {
  enablePrediction: boolean;
  autoOptimization: boolean;
  costModel: 'Low' | 'Medium' | 'High';
  currency: 'USD' | 'INR';
  emailAddress?: string;
  enableAutoEmailReports: boolean;
  emailFrequency: 'Daily' | 'Weekly' | 'Monthly';
}

export const STORAGE_COSTS = {
  HOT: { Low: 0.015, Medium: 0.023, High: 0.030 },
  WARM: { Low: 0.008, Medium: 0.0125, High: 0.018 },
  COLD: { Low: 0.002, Medium: 0.004, High: 0.007 },
};

export const INDUSTRY_STATS = {
  wastePercentage: 62,
  avgSavings: 45,
  potentialWasteTB: 10,
  costPerTB: {
    HOT: 1800,
    WARM: 1100,
    COLD: 500
  }
};
