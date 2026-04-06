import { FileData, STORAGE_COSTS } from '../types';

/**
 * Step 2 & 3: Data Processing & Classification Engine
 */
export const processStorageData = (data: any[], costModel: 'Low' | 'Medium' | 'High' = 'Medium'): FileData[] => {
  // Calculate max size and max raw consistency for normalization
  let max_size = 1;
  let max_raw_consistency = 0.001;

  const rawData = data.map(row => {
    const size = parseFloat(row.size) || Math.floor(Math.random() * 500) + 1;
    const access_count = parseInt(row.access_count) || Math.floor(Math.random() * 100);
    const last_access_days = parseInt(row.last_access_days) || Math.floor(Math.random() * 180);
    const raw_consistency = access_count / (last_access_days + 1);

    if (size > max_size) max_size = size;
    if (raw_consistency > max_raw_consistency) max_raw_consistency = raw_consistency;

    return { ...row, size, access_count, last_access_days, raw_consistency };
  });

  const processedData = rawData.map((row) => {
    const { size, access_count, last_access_days, raw_consistency } = row;

    // 1. Feature Engineering (Internal for prediction - DO NOT change prediction logic)
    const recency_score_internal = Math.max(0, 100 - last_access_days);
    const frequency_score_internal = Math.min(100, access_count);

    // 2. Prediction Feature (DO NOT CHANGE LOGIC)
    let prediction: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    const totalScore = (recency_score_internal * 0.6) + (frequency_score_internal * 0.4);
    
    if (totalScore > 75) prediction = 'HIGH';
    else if (totalScore > 40) prediction = 'MEDIUM';

    // 3. NEW Parameters
    const normalized_access_frequency = Math.min(100, access_count);
    const recency_score = Math.max(0, Math.min(100, 100 - last_access_days));
    const size_score = (1 - (size / max_size)) * 100;
    const consistency_score = Math.min(100, (raw_consistency / max_raw_consistency) * 100);
    
    // 4. NEW Storage Priority Score Calculation
    // Formula: (0.35 * Access Frequency Score) + (0.30 * Recency Score) + (0.20 * Size Score) + (0.15 * Consistency Score)
    const storage_priority_score = Math.round(
      (0.35 * normalized_access_frequency) + 
      (0.30 * recency_score) + 
      (0.20 * size_score) + 
      (0.15 * consistency_score)
    );

    // 5. Classification Engine
    let tier: 'HOT' | 'WARM' | 'COLD';
    if (prediction === 'HIGH' || last_access_days < 7) {
      tier = 'HOT';
    } else if (prediction === 'MEDIUM' || last_access_days < 30) {
      tier = 'WARM';
    } else if (prediction === 'LOW' || last_access_days >= 30) {
      tier = 'COLD';
    } else {
      // Edge case: assign to WARM by default as requested
      tier = 'WARM';
    }

    // 6. Cost Optimization
    const sizeGB = size / 1024;
    const current_cost = sizeGB * STORAGE_COSTS.HOT[costModel];
    const optimized_cost = sizeGB * STORAGE_COSTS[tier][costModel];

    // 7. Predictive Access & Scheduling Logic
    let next_expected_access_time = 30;
    let suggested_action = "";

    if (access_count > 50 && last_access_days < 7) {
      next_expected_access_time = Math.floor(Math.random() * 3) + 1;
    } else if (access_count > 20) {
      next_expected_access_time = Math.floor(Math.random() * 7) + 7;
    } else {
      next_expected_access_time = Math.floor(Math.random() * 30) + 30;
    }

    suggested_action = `This file is likely to be accessed in ${next_expected_access_time} days.`;
    if (tier === 'COLD' && next_expected_access_time < 15) {
      suggested_action += " Consider moving to WARM/HOT before that time.";
    }

    return {
      file_name: row.file_name || `file_${Math.random().toString(36).substr(2, 5)}`,
      size,
      access_count,
      last_access_days,
      recency_score,
      frequency_score: frequency_score_internal,
      consistency_score,
      storage_priority_score,
      tier,
      prediction,
      current_cost,
      optimized_cost,
      next_expected_access_time,
      suggested_action,
      scheduling_enabled: false,
      was_moved_by_scheduler: false,
    };
  });

  // Calculate thresholds for waste detection (relative to dataset distribution)
  const sortedAccess = [...processedData].sort((a, b) => a.access_count - b.access_count);
  const sortedLastAccess = [...processedData].sort((a, b) => a.last_access_days - b.last_access_days);
  const sortedSize = [...processedData].sort((a, b) => a.size - b.size);
  const sortedPriority = [...processedData].sort((a, b) => (a.storage_priority_score || 0) - (b.storage_priority_score || 0));

  const threshold_low_access = sortedAccess[Math.floor(processedData.length * 0.25)]?.access_count || 10;
  const threshold_high_last_access = sortedLastAccess[Math.floor(processedData.length * 0.75)]?.last_access_days || 60;
  const threshold_large_size = sortedSize[Math.floor(processedData.length * 0.75)]?.size || 100;
  const threshold_low_priority = sortedPriority[Math.floor(processedData.length * 0.25)]?.storage_priority_score || 30;

  return processedData.map(file => {
    const isWaste = 
      file.access_count <= threshold_low_access &&
      file.last_access_days >= threshold_high_last_access &&
      file.size >= threshold_large_size &&
      (file.storage_priority_score || 0) <= threshold_low_priority;

    return { ...file, isWaste };
  });
};

export const generateSampleData = (count: number = 10): FileData[] => {
  const samples = Array.from({ length: count }).map((_, i) => ({
    file_name: `sample_report_${i + 1}.pdf`,
    size: Math.floor(Math.random() * 200) + 10,
    access_count: Math.floor(Math.random() * 50),
    last_access_days: Math.floor(Math.random() * 120),
  }));
  return processStorageData(samples);
};
