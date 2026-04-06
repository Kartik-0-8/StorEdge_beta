import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Database, 
  TrendingDown, 
  Zap, 
  Snowflake, 
  Flame, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ChevronRight, 
  Info,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Loader2,
  HelpCircle,
  Trash2,
  Download,
  Mail,
  Sun,
  Moon,
  Lock,
  User,
  LogOut
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { processStorageData, generateSampleData } from './services/storageService';
import { FileData, STORAGE_COSTS, INDUSTRY_STATS, AppSettings, Alert } from './types';
import { cn } from './lib/utils';
import { GlobalBackground } from './components/GlobalBackground';

// --- Constants ---
const TIER_COLORS = {
  HOT: '#ef4444',
  WARM: '#f59e0b',
  COLD: '#3b82f6'
};

// --- Components ---
const CountUp = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = start + (end - start) * easeOutQuad(progress);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const MetricCard = ({ title, value, subValue, icon: Icon, color, delta, numericValue, prefix = '', suffix = '' }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    whileHover={{ 
      y: -8, 
      transition: { duration: 0.3 },
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 15px 0px rgba(99, 102, 241, 0.2)"
    }}
    className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
      <Icon size={64} />
    </div>
    <div className="flex justify-between items-start">
      <span className="text-muted-foreground text-sm font-medium">{title}</span>
      <div className={cn("p-2 rounded-lg shadow-lg", color)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="mt-2">
      <h3 className="text-3xl font-bold tracking-tight">
        {numericValue !== undefined ? (
          <CountUp value={numericValue} prefix={prefix} suffix={suffix} decimals={numericValue % 1 === 0 ? 0 : 2} />
        ) : value}
      </h3>
      <div className="flex items-center gap-2 mt-1">
        {delta !== undefined && (
          <span className={cn("text-xs font-medium flex items-center", delta > 0 ? "text-emerald-400" : "text-red-400")}>
            {delta > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            <CountUp value={Math.abs(delta)} suffix="%" />
          </span>
        )}
        <p className="text-xs text-muted-foreground">{subValue}</p>
      </div>
    </div>
  </motion.div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <motion.button 
    whileHover={{ x: 5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 btn-glow",
      active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
    )}
  >
    <Icon size={20} className={cn(active ? "animate-pulse" : "")} />
    <span className="font-medium">{label}</span>
  </motion.button>
);

const SectionHeader = ({ title, description, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 mb-8"
  >
    <div className="p-3 bg-indigo-600/20 rounded-2xl shadow-inner">
      <Icon className="text-indigo-400" size={28} />
    </div>
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </motion.div>
);

const AlertBox = ({ alert }: any) => {
  const styles: any = {
    INFO: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    WARNING: "bg-amber-500/10 border-amber-500/20 text-amber-400 pulse-warning",
    CRITICAL: "bg-red-500/10 border-red-500/20 text-red-400 pulse-critical"
  };

  const icons: any = {
    INFO: <Info size={18} />,
    WARNING: <AlertCircle size={18} />,
    CRITICAL: <AlertCircle size={18} />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("p-4 rounded-xl border flex items-center gap-3 shadow-lg", styles[alert.severity])}
    >
      <div className="shrink-0 p-2 rounded-lg bg-white/5">
        {icons[alert.severity]}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{alert.message}</p>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 py-1 bg-white/5 rounded">
        {alert.severity}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('storedge-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('storedge-theme', theme);
  }, [theme]);

  const isLight = theme === 'light';
  const chartColors = useMemo(() => ({
    text: isLight ? '#64748b' : '#a1a1aa',
    grid: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    tooltipBg: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(24, 24, 27, 0.9)',
    tooltipBorder: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    tooltipText: isLight ? '#0f172a' : '#ffffff',
    tooltipShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }), [isLight]);

  const [data, setData] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [visibleRows, setVisibleRows] = useState(100);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: 'Optimization Success',
    description: 'Your storage tiers have been updated successfully 🚀'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileData; direction: 'asc' | 'desc' } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    enablePrediction: true,
    autoOptimization: true,
    costModel: 'Medium',
    currency: 'INR',
    emailAddress: '',
    enableAutoEmailReports: false,
    emailFrequency: 'Weekly'
  });

  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('storedge-logged-in') === 'true';
  });
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('storedge-is-guest') === 'true';
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email === 'demo@storedge.com' && loginForm.password === '1234') {
      setIsLoggedIn(true);
      setIsGuest(false);
      localStorage.setItem('storedge-logged-in', 'true');
      localStorage.setItem('storedge-is-guest', 'false');
      setLoginError('');
    } else if (loginForm.email && loginForm.password) {
      // Accept any non-empty as per requirement option 1
      setIsLoggedIn(true);
      setIsGuest(false);
      localStorage.setItem('storedge-logged-in', 'true');
      localStorage.setItem('storedge-is-guest', 'false');
      setLoginError('');
    } else {
      setLoginError('Please enter valid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsGuest(false);
    localStorage.removeItem('storedge-logged-in');
    localStorage.removeItem('storedge-is-guest');
    setActiveTab('dashboard');
  };

  const LoginInfo = () => {
    const [factIndex, setFactIndex] = useState(0);
    const facts = [
      { text: "Up to 80% of enterprise data is rarely accessed but still stored in expensive systems.", icon: Database },
      { text: "Organizations can reduce storage costs by up to 30–50% with proper optimization.", icon: TrendingDown },
      { text: "Cold storage can cost up to 70% less than hot storage.", icon: Snowflake },
      { text: "Most companies lack visibility into their storage usage patterns.", icon: BarChart3 },
      { text: "Data growth is increasing exponentially, doubling every 2 years.", icon: Zap },
    ];

    useEffect(() => {
      const timer = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
      }, 5000);
      return () => clearInterval(timer);
    }, []);

    const CurrentIcon = facts[factIndex].icon;

    return (
      <div className="flex flex-col gap-10 w-full max-w-lg">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Industry Insights</h3>
          </div>
          <div className="h-40 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={factIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 border-white/10 flex items-start gap-6 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CurrentIcon size={80} />
                </div>
                <div className="p-4 bg-indigo-600/20 rounded-2xl shrink-0 shadow-inner">
                  <CurrentIcon size={32} className="text-indigo-400" />
                </div>
                <p className="text-lg leading-relaxed text-white/80 font-medium">
                  {facts[factIndex].text}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            {facts.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === factIndex ? "w-8 bg-indigo-600" : "w-2 bg-white/10"
                )} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">What is Storedge?</h3>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 border-white/10 shadow-2xl"
          >
            <p className="text-lg leading-relaxed text-white/70">
              Storedge is a storage optimization engine that analyzes file usage and intelligently classifies data into hot, warm, and cold tiers to reduce costs and improve efficiency.
            </p>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-transparent p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side: Info (Hidden on small screens, shown on large) */}
        <div className="hidden lg:block">
          <LoginInfo />
        </div>

        {/* Right Side: Login Form */}
        <div className="flex justify-center lg:justify-end">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 w-full max-w-md border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20">
                <Database className="text-white" size={32} />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Storedge</h1>
                <p className="text-muted-foreground text-sm">Storage Optimization Engine</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email / Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    placeholder="demo@storedge.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>

              {loginError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs font-medium text-center"
                >
                  {loginError}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 btn-glow"
              >
                Login
              </motion.button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--background)] px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setIsLoggedIn(true);
                  setIsGuest(true);
                  localStorage.setItem('storedge-logged-in', 'true');
                  localStorage.setItem('storedge-is-guest', 'true');
                }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                Continue as Guest
              </motion.button>
            </form>

            <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-widest">
              Secure Enterprise Access
            </p>
          </motion.div>
        </div>

        {/* Mobile Info (Shown below form on small screens) */}
        <div className="lg:hidden">
          <LoginInfo />
        </div>
      </div>
    </div>
  );

  // Simulation State
  const [simStrategy, setSimStrategy] = useState<'ALL_HOT' | 'ALL_WARM' | 'ALL_COLD' | 'PARTIAL_COLD' | 'PARTIAL_WARM' | 'SCORE_THRESHOLD' | 'ACCESS_THRESHOLD' | 'SIZE_THRESHOLD' | 'FREQ_THRESHOLD' | 'CUSTOM'>('ALL_HOT');
  const [simPercent, setSimPercent] = useState(50);
  const [simScoreThreshold, setSimScoreThreshold] = useState(50);
  const [simAccessThreshold, setSimAccessThreshold] = useState(30);
  const [simSizeThreshold, setSimSizeThreshold] = useState(100);
  const [simFreqThreshold, setSimFreqThreshold] = useState(5);
  const [simCustomConditions, setSimCustomConditions] = useState({ score: true, access: true });

  // Sample data for initial state
  const sampleData = useMemo(() => generateSampleData(15), []);
  const displayData = (data.length > 0) ? data : (isGuest ? sampleData : []);
  const isUsingSample = data.length === 0 && isGuest;
  const showEmptyState = data.length === 0 && !isGuest && isLoggedIn;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSelectedFile(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Simulate a bit of processing time for UX
        setTimeout(() => {
          const processed = processStorageData(results.data, settings.costModel);
          setData(processed);
          setIsProcessing(false);
          setSuccessMessage({
            title: 'Optimization Success',
            description: 'Your storage tiers have been updated successfully 🚀'
          });
          setShowSuccess(true);
          setActiveTab('dashboard');
          setTimeout(() => setShowSuccess(false), 3000);

          // Auto-email report if enabled
          if (settings.enableAutoEmailReports && settings.emailAddress) {
            handleSendReport(processed);
          }
        }, 1500);
      },
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const exportData = filteredData.map(file => ({
      'File Name': file.file_name,
      'Access Count': file.access_count,
      'Last Access Days': file.last_access_days,
      'Size (MB)': file.size,
      'Consistency Score': file.consistency_score,
      'Storage Priority Score': file.storage_priority_score,
      'Prediction': file.prediction,
      'Current Tier': file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier,
      'Waste Flag': file.isWaste ? 'YES' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "File Analysis");
    
    XLSX.writeFile(workbook, "storedge_file_analysis.xlsx");
    
    setSuccessMessage({
      title: 'Export Success',
      description: 'Your storage analysis has been exported to Excel successfully 📊'
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSendReport = (customData?: FileData[]) => {
    const reportData = customData || displayData;
    if (reportData.length === 0) return;

    const email = settings.emailAddress;
    if (!email) return;

    // Calculate distribution
    const hotCount = reportData.filter(f => (f.overrideTier && f.overrideTier !== 'AUTO' ? f.overrideTier : f.tier) === 'HOT').length;
    const warmCount = reportData.filter(f => (f.overrideTier && f.overrideTier !== 'AUTO' ? f.overrideTier : f.tier) === 'WARM').length;
    const coldCount = reportData.filter(f => (f.overrideTier && f.overrideTier !== 'AUTO' ? f.overrideTier : f.tier) === 'COLD').length;

    // Calculate total size and costs
    let currentCost = 0;
    let optimizedCost = 0;
    const wasteFiles = reportData.filter(f => f.isWaste);

    reportData.forEach(file => {
      const sizeGB = file.size / 1024;
      const tier = file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier;
      const costPerGB = STORAGE_COSTS[tier || 'HOT'][settings.costModel];
      currentCost += sizeGB * costPerGB;
      
      const optTier = file.tier || 'HOT';
      const optCostPerGB = STORAGE_COSTS[optTier][settings.costModel];
      optimizedCost += sizeGB * optCostPerGB;
    });

    const avgPriorityScore = reportData.reduce((acc, f) => acc + (f.storage_priority_score || 0), 0) / reportData.length;
    const currencySymbol = settings.currency === 'INR' ? '₹' : '$';

    // Key Alerts (Simplified for report)
    const reportAlerts = [];
    if (coldCount / reportData.length > 0.6) reportAlerts.push('High amount of inactive data detected.');
    if (avgPriorityScore < 40) reportAlerts.push('Storage system is inefficient.');
    if (wasteFiles.length > 0) reportAlerts.push(`${wasteFiles.length} waste files identified.`);

    // Simulate sending (Console log for demo)
    console.log(`
      --- Storedge Storage Report ---
      Sent to: ${email}
      Frequency: ${settings.emailFrequency}
      
      Summary:
      - Total Files: ${reportData.length}
      - Distribution: HOT: ${hotCount}, WARM: ${warmCount}, COLD: ${coldCount}
      - Overall Storage Priority Score: ${avgPriorityScore.toFixed(1)}
      - Estimated Monthly Cost: ${currencySymbol}${currentCost.toFixed(2)}
      - Potential Savings: ${currencySymbol}${(currentCost - optimizedCost).toFixed(2)}
      - Top Waste Files: ${wasteFiles.length}
      - Key Alerts: ${reportAlerts.length > 0 ? reportAlerts.join(' ') : 'None'}
      
      Attachment: storedge_file_analysis.xlsx
      -------------------------------
    `);

    setSuccessMessage({
      title: 'Report Sent Successfully',
      description: `Storage analysis report has been sent to ${email} 📧`
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const stats = useMemo(() => {
    let totalSizeMB = 0;
    let currentCost = 0;
    let optimizedCost = 0;

    for (let i = 0; i < displayData.length; i++) {
      const file = displayData[i];
      totalSizeMB += file.size;
      
      const sizeGB = file.size / 1024;
      const effectiveTier = file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier;
      
      currentCost += (file.current_cost || 0);
      optimizedCost += (sizeGB * STORAGE_COSTS[effectiveTier as keyof typeof STORAGE_COSTS][settings.costModel]);
    }

    const totalSizeGB = totalSizeMB / 1024;
    const savings = currentCost - optimizedCost;
    const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;
    const avgPriorityScore = displayData.length > 0 
      ? displayData.reduce((acc, curr) => acc + (curr.storage_priority_score || 0), 0) / displayData.length 
      : 0;
    const avgConsistencyScore = displayData.length > 0
      ? displayData.reduce((acc, curr) => acc + (curr.consistency_score || 0), 0) / displayData.length
      : 0;

    return {
      totalFiles: displayData.length,
      totalSizeGB: totalSizeGB.toFixed(2),
      currentCost: currentCost.toFixed(2),
      optimizedCost: optimizedCost.toFixed(2),
      savings: savings.toFixed(2),
      savingsPercent: savingsPercent.toFixed(1),
      wastePercent: INDUSTRY_STATS.wastePercentage,
      avgPriorityScore: Math.round(avgPriorityScore),
      avgConsistencyScore: Math.round(avgConsistencyScore)
    };
  }, [displayData, settings.costModel]);

  const prevAvgPriorityScore = useRef<number | null>(null);

  const alerts = useMemo(() => {
    const activeAlerts: Alert[] = [];

    // A) HIGH COLD DATA ALERT
    const coldFilesCount = displayData.filter(f => {
      const effectiveTier = f.overrideTier && f.overrideTier !== 'AUTO' ? f.overrideTier : f.tier;
      return effectiveTier === 'COLD';
    }).length;
    const coldPercent = (coldFilesCount / displayData.length) * 100;
    if (coldPercent > 60) {
      activeAlerts.push({
        id: 'high-cold',
        type: 'HIGH_COLD',
        message: 'High amount of inactive data detected. Consider optimization.',
        severity: 'WARNING'
      });
    }

    // B) STORAGE INEFFICIENCY ALERT
    if (stats.avgPriorityScore < 40) {
      activeAlerts.push({
        id: 'inefficiency',
        type: 'INEFFICIENCY',
        message: 'Storage system is inefficient. Too much low-value data detected.',
        severity: 'CRITICAL'
      });
    }

    // C) HIGH COST ALERT
    // Threshold based on dataset size: e.g. if cost per GB > $0.025 (which is higher than HOT in low/med)
    const costPerGB = parseFloat(stats.currentCost) / parseFloat(stats.totalSizeGB);
    if (costPerGB > 0.025) {
      activeAlerts.push({
        id: 'high-cost',
        type: 'HIGH_COST',
        message: 'High storage cost detected. Optimization recommended.',
        severity: 'CRITICAL'
      });
    }

    // D) UNUSED FILES ALERT
    const unusedFiles = displayData.filter(f => f.access_count < 5 && f.last_access_days > 90).length;
    if (unusedFiles > displayData.length * 0.3) {
      activeAlerts.push({
        id: 'unused-files',
        type: 'UNUSED_FILES',
        message: 'Large number of unused files identified.',
        severity: 'WARNING'
      });
    }

    // E) SUDDEN PATTERN CHANGE ALERT
    if (prevAvgPriorityScore.current !== null) {
      const drop = prevAvgPriorityScore.current - stats.avgPriorityScore;
      if (drop > 15) { // Threshold for "sudden drop"
        activeAlerts.push({
          id: 'pattern-change',
          type: 'PATTERN_CHANGE',
          message: 'Unusual change in data usage pattern detected.',
          severity: 'WARNING'
        });
      }
    }

    return activeAlerts;
  }, [displayData, stats.avgPriorityScore, stats.currentCost, stats.totalSizeGB]);

  // Update previous score
  useEffect(() => {
    prevAvgPriorityScore.current = stats.avgPriorityScore;
  }, [stats.avgPriorityScore]);

  const currencySymbol = settings.currency === 'INR' ? '₹' : '$';
  const currencyFactor = settings.currency === 'INR' ? 83 : 1; // Simple conversion for demo

  const handleToggleScheduling = (fileName: string) => {
    const updatedData = displayData.map(file => {
      if (file.file_name === fileName) {
        return { ...file, scheduling_enabled: !file.scheduling_enabled };
      }
      return file;
    });
    setData(updatedData);
    
    if (selectedFile && selectedFile.file_name === fileName) {
      setSelectedFile({ ...selectedFile, scheduling_enabled: !selectedFile.scheduling_enabled });
    }
  };

  const handleOverrideChange = (fileName: string, newOverride: 'AUTO' | 'HOT' | 'WARM' | 'COLD') => {
    const baseData = data.length > 0 ? data : sampleData;
    const updatedData = baseData.map(file => {
      if (file.file_name === fileName) {
        const effectiveTier = newOverride === 'AUTO' ? (file.tier || 'COLD') : newOverride;
        const sizeGB = file.size / 1024;
        const optimized_cost = sizeGB * STORAGE_COSTS[effectiveTier as keyof typeof STORAGE_COSTS][settings.costModel];
        return { ...file, overrideTier: newOverride, optimized_cost };
      }
      return file;
    });
    setData(updatedData);
    
    if (selectedFile && selectedFile.file_name === fileName) {
      const effectiveTier = newOverride === 'AUTO' ? (selectedFile.tier || 'COLD') : newOverride;
      const sizeGB = selectedFile.size / 1024;
      const optimized_cost = sizeGB * STORAGE_COSTS[effectiveTier as keyof typeof STORAGE_COSTS][settings.costModel];
      setSelectedFile({ ...selectedFile, overrideTier: newOverride, optimized_cost });
    }
  };

  const tierData = useMemo(() => {
    const counts = { HOT: 0, WARM: 0, COLD: 0 };
    
    for (let i = 0; i < displayData.length; i++) {
      const file = displayData[i];
      const tier = file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier;
      if (tier && tier in counts) {
        counts[tier as keyof typeof counts]++;
      } else {
        // Fallback for unclassified files
        counts.WARM++;
      }
    }

    return [
      { name: 'HOT', value: counts.HOT, color: TIER_COLORS.HOT },
      { name: 'WARM', value: counts.WARM, color: TIER_COLORS.WARM },
      { name: 'COLD', value: counts.COLD, color: TIER_COLORS.COLD },
    ].filter(t => t.value > 0);
  }, [displayData]);

  const predictionData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    
    for (let i = 0; i < displayData.length; i++) {
      const pred = displayData[i].prediction;
      if (pred && pred in counts) {
        counts[pred as keyof typeof counts]++;
      } else {
        // Fallback for unclassified predictions
        counts.LOW++;
      }
    }

    return [
      { name: 'High Usage', value: counts.HIGH },
      { name: 'Medium Usage', value: counts.MEDIUM },
      { name: 'Low Usage', value: counts.LOW },
    ];
  }, [displayData]);

  const filteredData = useMemo(() => {
    let result = displayData.filter(file => {
      const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const effectiveTier = file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier;
      const matchesTier = filterTier === 'ALL' || effectiveTier === filterTier;
      return matchesSearch && matchesTier;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'tier') {
          aValue = a.overrideTier && a.overrideTier !== 'AUTO' ? a.overrideTier : a.tier;
          bValue = b.overrideTier && b.overrideTier !== 'AUTO' ? b.overrideTier : b.tier;
        }

        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [displayData, searchTerm, filterTier, sortConfig]);

  useEffect(() => {
    setVisibleRows(100);
  }, [searchTerm, filterTier, sortConfig]);

  useEffect(() => {
    if (activeTab !== 'analysis') return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleRows < filteredData.length) {
        setVisibleRows(prev => Math.min(prev + 100, filteredData.length));
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, visibleRows, filteredData.length]);

  const simulatedData = useMemo(() => {
    const result = displayData.map((file, index) => {
      const hasOverride = file.overrideTier && file.overrideTier !== 'AUTO';
      const effectiveTier = hasOverride ? file.overrideTier : file.tier;
      
      let newTier = effectiveTier;

      if (!hasOverride) {
        switch (simStrategy) {
          case 'ALL_HOT':
            newTier = 'HOT';
            break;
          case 'ALL_WARM':
            newTier = 'WARM';
            break;
          case 'ALL_COLD':
            newTier = 'COLD';
            break;
          case 'PARTIAL_COLD':
            newTier = (index / displayData.length) * 100 < simPercent ? 'COLD' : file.tier;
            break;
          case 'PARTIAL_WARM':
            newTier = (index / displayData.length) * 100 < simPercent ? 'WARM' : file.tier;
            break;
          case 'SCORE_THRESHOLD':
            newTier = (file.storage_priority_score || 0) < simScoreThreshold ? 'COLD' : file.tier;
            break;
          case 'ACCESS_THRESHOLD':
            newTier = file.last_access_days > simAccessThreshold ? 'COLD' : file.tier;
            break;
          case 'SIZE_THRESHOLD':
            newTier = file.size > simSizeThreshold ? 'COLD' : file.tier;
            break;
          case 'FREQ_THRESHOLD':
            newTier = file.access_count > simFreqThreshold ? 'HOT' : file.tier;
            break;
          case 'CUSTOM':
            const lowScore = (file.storage_priority_score || 0) < simScoreThreshold;
            const oldAccess = file.last_access_days > simAccessThreshold;
            if (simCustomConditions.score && simCustomConditions.access) {
              newTier = (lowScore && oldAccess) ? 'COLD' : file.tier;
            } else if (simCustomConditions.score) {
              newTier = lowScore ? 'COLD' : file.tier;
            } else if (simCustomConditions.access) {
              newTier = oldAccess ? 'COLD' : file.tier;
            }
            break;
        }
      }

      const costPerGB = STORAGE_COSTS[newTier as keyof typeof STORAGE_COSTS][settings.costModel];
      const simulatedCost = (file.size / 1024) * costPerGB;

      return {
        ...file,
        simulatedTier: newTier,
        simulatedCost
      };
    });

    return result;
  }, [displayData, simStrategy, simPercent, simScoreThreshold, simAccessThreshold, simSizeThreshold, simFreqThreshold, simCustomConditions, settings.costModel]);

  const simStats = useMemo(() => {
    const totalSimCost = simulatedData.reduce((acc, curr) => acc + curr.simulatedCost, 0);
    const currentCost = parseFloat(stats.currentCost);
    const allHotCost = displayData.reduce((acc, curr) => acc + (curr.size / 1024) * STORAGE_COSTS.HOT[settings.costModel], 0);
    
    const savingsVsCurrent = currentCost - totalSimCost;
    const savingsVsCurrentPercent = currentCost > 0 ? (savingsVsCurrent / currentCost) * 100 : 0;
    
    const savingsVsHot = allHotCost - totalSimCost;
    const savingsVsHotPercent = allHotCost > 0 ? (savingsVsHot / allHotCost) * 100 : 0;

    const counts = { HOT: 0, WARM: 0, COLD: 0 };
    simulatedData.forEach(d => {
      counts[d.simulatedTier as keyof typeof counts]++;
    });

    const simTierData = [
      { name: 'HOT', value: counts.HOT, color: TIER_COLORS.HOT },
      { name: 'WARM', value: counts.WARM, color: TIER_COLORS.WARM },
      { name: 'COLD', value: counts.COLD, color: TIER_COLORS.COLD },
    ].filter(t => t.value > 0);

    return {
      totalSimCost,
      savingsVsCurrent,
      savingsVsCurrentPercent,
      savingsVsHot,
      savingsVsHotPercent,
      simTierData,
      allHotCost
    };
  }, [simulatedData, stats.currentCost, displayData, settings.costModel]);

  const handleSort = (key: keyof FileData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const simulateSchedulingCycle = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const updatedData = displayData.map(file => {
        // 1. Scheduling Logic: If scheduling enabled and predicted access is soon (<= 7 days)
        if (file.scheduling_enabled && file.next_expected_access_time! <= 7) {
          let newTier = file.tier;
          if (file.prediction === 'HIGH') newTier = 'HOT';
          else if (file.prediction === 'MEDIUM') newTier = 'WARM';
          
          if (newTier !== file.tier) {
            return { 
              ...file, 
              tier: newTier, 
              was_moved_by_scheduler: true,
              suggested_action: `Moved to ${newTier} by Smart Scheduler. Reversal window active.`
            };
          }
        }
        
        // 2. Reversal Logic: If moved by scheduler but not accessed (simulated by high last_access_days)
        if (file.was_moved_by_scheduler && file.last_access_days > 30) {
          return {
            ...file,
            tier: 'COLD',
            was_moved_by_scheduler: false,
            suggested_action: "Moved back to COLD due to no access after scheduled move."
          };
        }
        
        return file;
      });
      
      setData(updatedData);
      setIsOptimizing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const storageHealth = useMemo(() => {
    const optimizedCount = displayData.filter(d => {
      const effectiveTier = d.overrideTier && d.overrideTier !== 'AUTO' ? d.overrideTier : d.tier;
      return effectiveTier !== 'HOT';
    }).length;
    return Math.round((optimizedCount / displayData.length) * 100);
  }, [displayData]);

  const growthData = useMemo(() => {
    // Simulated growth data over 6 months
    const baseSize = parseFloat(stats.totalSizeGB);
    return [
      { month: 'Oct', size: baseSize * 0.85 },
      { month: 'Nov', size: baseSize * 0.88 },
      { month: 'Dec', size: baseSize * 0.92 },
      { month: 'Jan', size: baseSize * 0.95 },
      { month: 'Feb', size: baseSize * 0.98 },
      { month: 'Mar', size: baseSize },
    ];
  }, [stats.totalSizeGB]);

  const priorityDistribution = useMemo(() => {
    const bins = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    displayData.forEach(file => {
      const score = file.storage_priority_score || 0;
      const binIdx = Math.min(4, Math.floor(score / 20));
      bins[binIdx]++;
    });
    return [
      { range: '0-20', count: bins[0] },
      { range: '21-40', count: bins[1] },
      { range: '41-60', count: bins[2] },
      { range: '61-80', count: bins[3] },
      { range: '81-100', count: bins[4] },
    ];
  }, [displayData]);

  const detailedAnalysisData = useMemo(() => {
    const accessBins = { '0-10': 0, '10-50': 0, '50-100': 0, '100+': 0 };
    const recencyBins = { '0-7': 0, '7-30': 0, '30-90': 0, '90+': 0 };
    const sizeBins = { 'Small (<10MB)': 0, 'Medium (10-100MB)': 0, 'Large (>100MB)': 0 };
    const consistencyBins = { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 };

    displayData.forEach(file => {
      // Access Count
      if (file.access_count <= 10) accessBins['0-10']++;
      else if (file.access_count <= 50) accessBins['10-50']++;
      else if (file.access_count <= 100) accessBins['50-100']++;
      else accessBins['100+']++;

      // Last Access Days
      if (file.last_access_days <= 7) recencyBins['0-7']++;
      else if (file.last_access_days <= 30) recencyBins['7-30']++;
      else if (file.last_access_days <= 90) recencyBins['30-90']++;
      else recencyBins['90+']++;

      // Size
      if (file.size < 10) sizeBins['Small (<10MB)']++;
      else if (file.size <= 100) sizeBins['Medium (10-100MB)']++;
      else sizeBins['Large (>100MB)']++;

      // Consistency
      const c = file.consistency_score || 0;
      if (c <= 25) consistencyBins['0-25']++;
      else if (c <= 50) consistencyBins['25-50']++;
      else if (c <= 75) consistencyBins['50-75']++;
      else consistencyBins['75-100']++;
    });

    return {
      access_count: Object.entries(accessBins).map(([range, count]) => ({ range, count })),
      last_access_days: Object.entries(recencyBins).map(([range, count]) => ({ range, count })),
      size: Object.entries(sizeBins).map(([range, count]) => ({ range, count })),
      consistency_score: Object.entries(consistencyBins).map(([range, count]) => ({ range, count }))
    };
  }, [displayData]);

  const wasteStats = useMemo(() => {
    const wasteFiles = data.filter(f => f.isWaste);
    const totalWasteSize = wasteFiles.reduce((acc, f) => acc + f.size, 0);
    const topWasteFiles = [...wasteFiles].sort((a, b) => {
      const scoreA = (a.size / 100) - ((a.storage_priority_score || 0) / 100);
      const scoreB = (b.size / 100) - ((b.storage_priority_score || 0) / 100);
      return scoreB - scoreA;
    }).slice(0, 10);
    
    return {
      wasteFilesCount: wasteFiles.length,
      totalWasteSize,
      topWasteFiles
    };
  }, [data]);

  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card max-w-2xl mx-auto mt-12 border-white/10 shadow-2xl"
    >
      <div className="bg-indigo-600/20 p-8 rounded-full mb-8 relative">
        <div className="absolute inset-0 bg-indigo-600/10 rounded-full animate-ping opacity-20" />
        <Database className="text-indigo-400 relative z-10" size={64} />
      </div>
      <h2 className="text-3xl font-extrabold mb-4 tracking-tight">No Data Available</h2>
      <p className="text-muted-foreground text-lg mb-10 max-w-md leading-relaxed">
        Upload your file data to start analyzing storage optimization.
      </p>
      <motion.label 
        whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 40px -10px rgba(79, 70, 229, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/30 btn-glow text-lg"
      >
        <Upload size={24} />
        Upload CSV
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
      </motion.label>
    </motion.div>
  );

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Smart Alerts Section */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <AlertBox key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {isUsingSample && (
        <div className="bg-indigo-600/10 border border-indigo-600/20 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Info className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Viewing Industry Benchmark Data</h3>
              <p className="text-muted-foreground text-sm">Upload your own CSV to get personalized storage optimization insights.</p>
            </div>
          </div>
          <motion.label 
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 btn-glow"
          >
            <Upload size={18} />
            Upload My Data
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </motion.label>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Estimated Monthly Cost" 
          value={
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Before Optimization:</span>
                <span className="font-mono text-base">
                  <CountUp value={parseFloat(stats.currentCost) * currencyFactor} prefix={currencySymbol} decimals={2} />
                  <span className="text-[10px] ml-1 text-muted-foreground">/ month</span>
                </span>
              </div>
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">After Optimization:</span>
                <span className="font-mono text-2xl text-emerald-400">
                  <CountUp value={parseFloat(stats.optimizedCost) * currencyFactor} prefix={currencySymbol} decimals={2} />
                  <span className="text-[10px] ml-1 text-muted-foreground">/ month</span>
                </span>
              </div>
            </div>
          }
          icon={DollarSign} 
          color="bg-blue-500" 
          delta={isUsingSample ? 12 : -8}
        />
        <MetricCard 
          title="Potential Savings" 
          value={
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Monthly Savings:</span>
                <span className="font-mono text-2xl text-emerald-400">
                  <CountUp value={parseFloat(stats.savings) * currencyFactor} prefix={currencySymbol} decimals={2} />
                  <span className="text-[10px] ml-1 text-muted-foreground">/ month</span>
                </span>
              </div>
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Savings Percentage:</span>
                <span className="font-mono text-base">
                  <CountUp value={parseFloat(stats.savingsPercent)} suffix="%" decimals={1} />
                </span>
              </div>
            </div>
          }
          icon={TrendingDown} 
          color="bg-emerald-500" 
          delta={isUsingSample ? undefined : 24}
        />
        <MetricCard 
          title="Total Files" 
          numericValue={stats.totalFiles}
          subValue="Uploaded to engine" 
          icon={FileText} 
          color="bg-indigo-500" 
        />
        <MetricCard 
          title="Storage Priority Score" 
          numericValue={stats.avgPriorityScore}
          suffix="/100"
          subValue={stats.avgPriorityScore > 70 ? "High Priority" : "Balanced"} 
          icon={Zap} 
          color={stats.avgPriorityScore > 70 ? "bg-amber-500" : "bg-indigo-500"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Storage Health Gauge */}
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-6 self-start flex items-center gap-2">
            <Zap size={20} className="text-amber-400" />
            Avg Priority Score
          </h3>
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={502.4}
                initial={{ strokeDashoffset: 502.4 }}
                whileInView={{ strokeDashoffset: 502.4 - (502.4 * stats.avgPriorityScore) / 100 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                className={cn(
                  stats.avgPriorityScore > 70 ? "text-amber-500" : stats.avgPriorityScore > 40 ? "text-indigo-500" : "text-red-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">
                <CountUp value={stats.avgPriorityScore} />
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            Overall storage priority is <span className="text-foreground font-bold">{stats.avgPriorityScore}/100</span>. 
            This reflects the combined weight of file size, access frequency, and recency across your dataset.
          </p>
        </div>

        {/* Distribution Chart */}
        <div className="glass-card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon size={20} className="text-indigo-400" />
              Tier Distribution
            </h3>
            <div className="flex gap-4">
              {tierData.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                  animationBegin={200}
                >
                  {tierData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    border: `1px solid ${chartColors.tooltipBorder}`, 
                    borderRadius: '12px', 
                    boxShadow: chartColors.tooltipShadow,
                    color: chartColors.tooltipText,
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {tierData.map(t => (
              <div key={t.name} className="text-center">
                <p className="text-xl font-bold">{t.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">{t.name} Files</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Score Distribution */}
        <div className="glass-card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-400" />
              Priority Score Distribution
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis 
                  dataKey="range" 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Score Range', position: 'insideBottom', offset: -40, fill: chartColors.text, fontSize: 12 }}
                />
                <YAxis 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Files', angle: -90, position: 'insideLeft', offset: 0, fill: chartColors.text, fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{fill: chartColors.grid}}
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    border: `1px solid ${chartColors.tooltipBorder}`, 
                    borderRadius: '12px',
                    color: chartColors.tooltipText,
                    boxShadow: chartColors.tooltipShadow,
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: chartColors.tooltipText }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Insight Card */}
        <div className="glass-card p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" />
              Industry Insight
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Companies waste up to <span className="text-foreground font-bold">60%</span> of their storage budget on "Cold" data stored in "Hot" tiers. 
              By moving rarely accessed files to archive tiers, you can reduce costs by up to <span className="text-emerald-400 font-bold">90%</span>.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Typical 10TB Cost</span>
                <span className="font-mono">{currencySymbol}{(10 * INDUSTRY_STATS.costPerTB.HOT).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Optimized 10TB Cost</span>
                <span className="text-emerald-400 font-mono">{currencySymbol}{(10 * INDUSTRY_STATS.costPerTB.COLD).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('cost')}
            className="mt-8 w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group btn-glow"
          >
            View Cost Breakdown
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderSimulator = () => {
    const strategies = [
      { id: 'ALL_HOT', label: 'All HOT Storage', desc: 'Maximum performance, highest cost.' },
      { id: 'ALL_WARM', label: 'All WARM Storage', desc: 'Balanced performance and cost.' },
      { id: 'ALL_COLD', label: 'All COLD Storage', desc: 'Minimum cost, archive performance.' },
      { id: 'PARTIAL_COLD', label: 'Partial COLD Shift', desc: 'Move a percentage of files to COLD.' },
      { id: 'PARTIAL_WARM', label: 'Partial WARM Shift', desc: 'Move a percentage of files to WARM.' },
      { id: 'SCORE_THRESHOLD', label: 'Score Threshold', desc: 'Move low priority files to COLD.' },
      { id: 'ACCESS_THRESHOLD', label: 'Access Threshold', desc: 'Move inactive files to COLD.' },
      { id: 'SIZE_THRESHOLD', label: 'Size Threshold', desc: 'Move large files to COLD.' },
      { id: 'FREQ_THRESHOLD', label: 'Frequency Boost', desc: 'Move active files to HOT.' },
      { id: 'CUSTOM', label: 'Custom Combined', desc: 'Combine score and access recency.' },
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <SectionHeader 
          title="What-If Simulator" 
          description="Simulate different storage strategies and predict financial outcomes without changing real data."
          icon={Zap}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 block">Select Strategy</label>
                <div className="grid grid-cols-1 gap-2">
                  {strategies.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSimStrategy(s.id as any)}
                      className={cn(
                        "text-left p-3 rounded-xl border transition-all",
                        simStrategy === s.id 
                          ? "bg-indigo-600/20 border-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-[10px] opacity-70">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Controls */}
              <AnimatePresence mode="wait">
                {(simStrategy === 'PARTIAL_COLD' || simStrategy === 'PARTIAL_WARM') && (
                  <motion.div 
                    key="partial"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Distribution Percentage</label>
                      <span className="text-indigo-400 font-mono font-bold">{simPercent}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simPercent} 
                      onChange={(e) => setSimPercent(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </motion.div>
                )}

                {(simStrategy === 'SCORE_THRESHOLD' || simStrategy === 'CUSTOM') && (
                  <motion.div 
                    key="score"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Score Threshold</label>
                      <span className="text-indigo-400 font-mono font-bold">{simScoreThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simScoreThreshold} 
                      onChange={(e) => setSimScoreThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    {simStrategy === 'CUSTOM' && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="custom-score"
                          checked={simCustomConditions.score} 
                          onChange={(e) => setSimCustomConditions(c => ({ ...c, score: e.target.checked }))}
                          className="accent-indigo-600"
                        />
                        <label htmlFor="custom-score" className="text-xs text-muted-foreground">Apply score condition</label>
                      </div>
                    )}
                  </motion.div>
                )}

                {(simStrategy === 'ACCESS_THRESHOLD' || simStrategy === 'CUSTOM') && (
                  <motion.div 
                    key="access"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Last Access (Days)</label>
                      <span className="text-indigo-400 font-mono font-bold">{simAccessThreshold}d</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="365" 
                      value={simAccessThreshold} 
                      onChange={(e) => setSimAccessThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    {simStrategy === 'CUSTOM' && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="custom-access"
                          checked={simCustomConditions.access} 
                          onChange={(e) => setSimCustomConditions(c => ({ ...c, access: e.target.checked }))}
                          className="accent-indigo-600"
                        />
                        <label htmlFor="custom-access" className="text-xs text-muted-foreground">Apply access condition</label>
                      </div>
                    )}
                  </motion.div>
                )}

                {simStrategy === 'SIZE_THRESHOLD' && (
                  <motion.div 
                    key="size"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Size Threshold (MB)</label>
                      <span className="text-indigo-400 font-mono font-bold">{simSizeThreshold}MB</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      value={simSizeThreshold} 
                      onChange={(e) => setSimSizeThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </motion.div>
                )}

                {simStrategy === 'FREQ_THRESHOLD' && (
                  <motion.div 
                    key="freq"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Access Count (Min)</label>
                      <span className="text-indigo-400 font-mono font-bold">{simFreqThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simFreqThreshold} 
                      onChange={(e) => setSimFreqThreshold(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    This is a simulation. No real changes will be applied to your storage infrastructure. All calculations are based on the selected cost model.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard 
                title="Simulated Monthly Cost" 
                numericValue={simStats.totalSimCost * currencyFactor} 
                prefix={currencySymbol}
                color="bg-indigo-600" 
                icon={DollarSign} 
                subValue="Predicted outcome"
              />
              <MetricCard 
                title="Savings vs Current" 
                numericValue={simStats.savingsVsCurrent * currencyFactor} 
                prefix={currencySymbol}
                color="bg-emerald-600" 
                icon={TrendingDown} 
                delta={simStats.savingsVsCurrentPercent}
                subValue="Monthly reduction"
              />
              <MetricCard 
                title="Savings vs All HOT" 
                numericValue={simStats.savingsVsHot * currencyFactor} 
                prefix={currencySymbol}
                color="bg-blue-600" 
                icon={ShieldCheck} 
                delta={simStats.savingsVsHotPercent}
                subValue="Efficiency gain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8">
                <h3 className="text-lg font-semibold mb-8">Simulated Tier Distribution</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={simStats.simTierData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                        animationBegin={200}
                      >
                        {simStats.simTierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          border: `1px solid ${chartColors.tooltipBorder}`, 
                          borderRadius: '12px',
                          color: chartColors.tooltipText,
                          boxShadow: chartColors.tooltipShadow,
                          backdropFilter: 'blur(8px)'
                        }}
                        itemStyle={{ color: chartColors.tooltipText }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-lg font-semibold mb-8">Cost Comparison</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'All HOT', cost: simStats.allHotCost * currencyFactor },
                        { name: 'Current', cost: parseFloat(stats.currentCost) * currencyFactor },
                        { name: 'Simulated', cost: simStats.totalSimCost * currencyFactor }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                      <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: chartColors.grid}}
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          border: `1px solid ${chartColors.tooltipBorder}`, 
                          borderRadius: '12px',
                          color: chartColors.tooltipText,
                          boxShadow: chartColors.tooltipShadow,
                          backdropFilter: 'blur(8px)'
                        }}
                        itemStyle={{ color: chartColors.tooltipText }}
                      />
                      <Bar dataKey="cost" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300}>
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#6366f1" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {simStats.savingsVsCurrent > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                    <TrendingDown className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-400">Optimal Strategy Detected</h4>
                    <p className="text-sm text-emerald-200/60">This strategy can save {currencySymbol}{(simStats.savingsVsCurrent * currencyFactor).toLocaleString()}/month compared to your current setup.</p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Efficiency Boost</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">+{simStats.savingsVsCurrentPercent.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAnalysis = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <SectionHeader 
        title="File Usage Analysis" 
        description="Detailed breakdown of your files and their predicted usage patterns."
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Search files..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Upload size={16} className="rotate-90" />
              </div>
            </div>
            <div className="flex gap-2">
              {['ALL', 'HOT', 'WARM', 'COLD'].map((tier) => (
                <motion.button
                  key={tier}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterTier(tier as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border btn-glow",
                    filterTier === tier 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {tier}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-semibold">File Inventory</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportExcel}
                  className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-600/30 transition-all"
                >
                  <Download size={12} /> Export to Excel
                </button>
                <button 
                  onClick={simulateSchedulingCycle}
                  disabled={isOptimizing}
                  className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1 rounded-full flex items-center gap-1 border border-indigo-600/30 transition-all"
                >
                  <Zap size={12} /> Simulate Scheduling Cycle
                </button>
                <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full flex items-center gap-1">
                  <Database size={12} /> {filteredData.length} Files Found
                </span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-[var(--background)]">
                  <tr className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('file_name')}
                    >
                      File Name {sortConfig?.key === 'file_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('access_count')}
                    >
                      Access Count {sortConfig?.key === 'access_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('last_access_days')}
                    >
                      Last Access Days {sortConfig?.key === 'last_access_days' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('size')}
                    >
                      Size (MB) {sortConfig?.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('consistency_score')}
                    >
                      Consistency Score {sortConfig?.key === 'consistency_score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('storage_priority_score')}
                    >
                      Storage Priority Score {sortConfig?.key === 'storage_priority_score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 font-medium text-center">Prediction</th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors text-center"
                      onClick={() => handleSort('next_expected_access_time')}
                    >
                      Next Access {sortConfig?.key === 'next_expected_access_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 font-medium text-center">Tier {sortConfig?.key === 'tier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th className="px-6 py-4 font-medium text-center">Waste Flag</th>
                    <th className="px-6 py-4 font-medium text-center">Manual Override</th>
                    <th className="px-6 py-4 font-medium text-center">Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {isProcessing ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                            <p className="text-muted-foreground animate-pulse">Analyzing storage patterns...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length > 0 ? (
                      <>
                        {filteredData.slice(0, visibleRows).map((file, idx) => (
                          <motion.tr 
                            key={file.file_name + idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSelectedFile(file)}
                            className={cn(
                              "hover:bg-white/5 transition-colors group cursor-pointer",
                              selectedFile?.file_name === file.file_name && "bg-indigo-600/10",
                              file.overrideTier && file.overrideTier !== 'AUTO' && "bg-indigo-500/5 border-l-2 border-l-indigo-500",
                              file.isWaste && "bg-red-500/5 border-l-2 border-l-red-500"
                            )}
                          >
                            <td className="px-6 py-4 font-medium text-sm flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                file.isWaste ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : (file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier) === 'HOT' ? "bg-red-500" : (file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier) === 'WARM' ? "bg-amber-500" : "bg-blue-500"
                              )} />
                              <span className={cn("truncate max-w-[150px]", file.isWaste && "text-red-400 font-bold")}>{file.file_name}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.access_count}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.last_access_days}d</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.size}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{(file.consistency_score || 0).toFixed(1)}%</td>
                            <td className="px-6 py-4 text-sm text-center font-mono">
                              <span className={cn(
                                "font-bold",
                                (file.storage_priority_score || 0) > 70 ? "text-emerald-400" :
                                (file.storage_priority_score || 0) > 30 ? "text-amber-400" :
                                "text-red-400"
                              )}>
                                {(file.storage_priority_score || 0).toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                file.prediction === 'HIGH' ? "bg-red-500/10 text-red-400" :
                                file.prediction === 'MEDIUM' ? "bg-amber-500/10 text-amber-400" :
                                "bg-blue-500/10 text-blue-400"
                              )}>
                                {file.prediction}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.next_expected_access_time}d</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={cn(
                                  "text-sm font-medium",
                                  file.overrideTier && file.overrideTier !== 'AUTO' && "text-indigo-400 font-bold"
                                )}>
                                  {file.overrideTier && file.overrideTier !== 'AUTO' ? file.overrideTier : file.tier}
                                </span>
                                {file.overrideTier && file.overrideTier !== 'AUTO' && (
                                  <div className="group relative">
                                    <ShieldCheck size={12} className="text-indigo-400" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-indigo-600 text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                      Manual Override Active
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {file.isWaste ? (
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                                  YES
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-muted-foreground">
                                  NO
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <select 
                                value={file.overrideTier || 'AUTO'}
                                onChange={(e) => handleOverrideChange(file.file_name, e.target.value as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-white/10"
                              >
                                <option value="AUTO" className="bg-[#1a1a1a]">AUTO</option>
                                <option value="HOT" className="bg-[#1a1a1a]">HOT</option>
                                <option value="WARM" className="bg-[#1a1a1a]">WARM</option>
                                <option value="COLD" className="bg-[#1a1a1a]">COLD</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                {file.scheduling_enabled ? (
                                  <CheckCircle2 size={16} className="text-emerald-400" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-white/20" />
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filteredData.length > visibleRows && (
                          <tr>
                            <td colSpan={12} className="px-6 py-8 text-center text-xs text-muted-foreground bg-white/5 italic">
                              <div ref={loadMoreRef} className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-indigo-500" size={16} />
                                <span>Loading more results... ({visibleRows} of {filteredData.length} shown)</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                          No files matching your search criteria.
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selectedFile ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-indigo-500/30 bg-indigo-500/5"
            >
              <div className="flex justify-between items-start mb-6">
                <h4 className="font-bold text-indigo-400">File Details</h4>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-white"
                >
                  <AlertCircle size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Name</p>
                  <p className="text-sm font-medium break-all">{selectedFile.file_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Size</p>
                    <p className="text-sm font-mono">{selectedFile.size} MB</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Current Tier</p>
                    <div className="flex items-center gap-1.5">
                      <p className={cn(
                        "text-sm font-mono",
                        selectedFile.overrideTier && selectedFile.overrideTier !== 'AUTO' && "text-indigo-400 font-bold"
                      )}>
                        {selectedFile.overrideTier && selectedFile.overrideTier !== 'AUTO' ? selectedFile.overrideTier : selectedFile.tier}
                      </p>
                      {selectedFile.overrideTier && selectedFile.overrideTier !== 'AUTO' && (
                        <ShieldCheck size={10} className="text-indigo-400" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Current Cost</span>
                    <span className="text-sm font-mono">{currencySymbol}{(selectedFile.current_cost! * currencyFactor).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Optimized Cost</span>
                    <span className="text-sm font-mono text-emerald-400">{currencySymbol}{(selectedFile.optimized_cost! * currencyFactor).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-indigo-400" />
                    <h5 className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Predictive Access</h5>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Next Access (Est.)</span>
                      <span className="text-xs font-mono text-indigo-300">{selectedFile.next_expected_access_time} days</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      "{selectedFile.suggested_action}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Smart Scheduling</p>
                      <p className="text-[9px] text-indigo-300/70">Auto-move to HOT/WARM on predicted date</p>
                    </div>
                    <button 
                      onClick={() => handleToggleScheduling(selectedFile.file_name)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-200",
                        selectedFile.scheduling_enabled ? "bg-indigo-600" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: selectedFile.scheduling_enabled ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-6 border-dashed border-white/10 flex flex-col items-center justify-center text-center py-12">
              <div className="p-3 bg-white/5 rounded-full mb-4">
                <Info size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select a file from the list to view detailed analysis</p>
            </div>
          )}

          <div className="glass-card p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-indigo-400" />
              Logic Explanation
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-xl border border-border">
                <p className="text-xs font-bold text-foreground mb-1">HOT TIER</p>
                <p className="text-[11px] text-muted-foreground">Accessed within 7 days or HIGH predicted future usage.</p>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border">
                <p className="text-xs font-bold text-foreground mb-1">WARM TIER</p>
                <p className="text-[11px] text-muted-foreground">Accessed within 30 days or MEDIUM predicted usage.</p>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border">
                <p className="text-xs font-bold text-foreground mb-1">COLD TIER</p>
                <p className="text-[11px] text-muted-foreground">No access for 30+ days and LOW predicted usage.</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 bg-indigo-600/10 border-indigo-600/20 group">
            <h4 className="font-bold text-indigo-400 mb-2">Run Optimization</h4>
            <p className="text-xs text-muted-foreground mb-4">Apply these tiering rules to your cloud provider via API.</p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 btn-glow"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap size={18} className="group-hover:animate-bounce" />
                  Execute Move
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCost = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <SectionHeader 
        title="Cost Savings & ROI" 
        description="Analyze the financial impact of storage tiering on your monthly budget."
        icon={TrendingDown}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-lg font-semibold mb-8">What-if Simulation</h3>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Flame className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Standard (All Hot)</p>
                  <p className="text-xs text-muted-foreground">No optimization applied</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono font-bold">{currencySymbol}{(parseFloat(stats.currentCost) * currencyFactor).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">PER MONTH</p>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="h-8 w-px bg-white/10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 p-1 rounded-full">
                  <Zap size={12} className="text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Storedge Optimized</p>
                  <p className="text-xs text-muted-foreground">Intelligent tiering active</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono font-bold text-emerald-400">{currencySymbol}{(parseFloat(stats.optimizedCost) * currencyFactor).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">PER MONTH</p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Net Monthly Savings</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-400">{currencySymbol}{(parseFloat(stats.savings) * currencyFactor).toLocaleString()}</span>
                <span className="ml-2 text-sm text-emerald-500/80">({stats.savingsPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-lg font-semibold mb-8">Tier Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Files', position: 'insideBottom', offset: -30, fill: chartColors.text, fontSize: 12 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Tier', angle: -90, position: 'insideLeft', offset: -10, fill: chartColors.text, fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{fill: chartColors.grid}}
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    border: `1px solid ${chartColors.tooltipBorder}`, 
                    borderRadius: '12px',
                    color: chartColors.tooltipText,
                    boxShadow: chartColors.tooltipShadow,
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: chartColors.tooltipText }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                  animationDuration={1500}
                >
                  {tierData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:filter hover:brightness-125 transition-all cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {Object.entries(STORAGE_COSTS).map(([tier, models]) => (
              <div key={tier} className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{tier}</p>
                <p className="text-sm font-mono">${models[settings.costModel]}/GB</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDetailedAnalysis = () => {
    const parameters = [
      { 
        key: 'access_count', 
        label: 'Access Frequency', 
        desc: 'Measures how often a file is retrieved. High frequency indicates active data that requires high-performance storage (HOT tier).',
        xAxisLabel: 'Access Count',
        histogramData: detailedAnalysisData.access_count
      },
      { 
        key: 'last_access_days', 
        label: 'Recency (Last Access)', 
        desc: 'Tracks the time elapsed since the last access. Data that hasn\'t been touched in weeks is a prime candidate for COLD storage.',
        xAxisLabel: 'Days Since Last Access',
        histogramData: detailedAnalysisData.last_access_days
      },
      { 
        key: 'size', 
        label: 'Size Impact', 
        desc: 'The storage footprint of the file. Larger files offer greater cost-saving potential when moved to optimized tiers.',
        xAxisLabel: 'Size (MB)',
        histogramData: detailedAnalysisData.size
      },
      {
        key: 'consistency_score',
        label: 'Access Consistency Score',
        desc: 'Measures how consistently a file is accessed over time. High scores indicate predictable, steady usage patterns.',
        xAxisLabel: 'Consistency Score',
        histogramData: detailedAnalysisData.consistency_score
      }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <SectionHeader 
          title="Detailed Analysis" 
          description="Deep dive into the core parameters driving your storage optimization engine."
          icon={BarChart3}
        />

        <div className="grid grid-cols-1 gap-8">
          {/* Main Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {parameters.map((param) => {
              return (
                <div key={param.key} className="glass-card p-6 flex flex-col h-full">
                  <h4 className="text-lg font-bold mb-2 text-foreground">{param.label}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                    {param.desc}
                  </p>
                  <div className="h-[180px] mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={param.histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                        <XAxis 
                          dataKey="range" 
                          stroke={chartColors.text} 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          label={{ value: param.xAxisLabel, position: 'insideBottom', offset: -30, fill: chartColors.text, fontSize: 10 }}
                        />
                        <YAxis 
                          stroke={chartColors.text} 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          label={{ value: 'Files', angle: -90, position: 'insideLeft', offset: 10, fill: chartColors.text, fontSize: 10 }}
                        />
                        <Tooltip 
                          cursor={{fill: chartColors.grid}}
                          contentStyle={{ 
                            backgroundColor: chartColors.tooltipBg, 
                            border: `1px solid ${chartColors.tooltipBorder}`, 
                            borderRadius: '12px',
                            color: chartColors.tooltipText,
                            boxShadow: chartColors.tooltipShadow,
                            backdropFilter: 'blur(8px)'
                          }}
                          itemStyle={{ color: chartColors.tooltipText }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} animationDuration={1500} animationBegin={300} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Storage Priority Score Highlight */}
          <div className="glass-card p-8 bg-indigo-600/5 border-indigo-600/20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Zap size={20} className="text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-foreground">Storage Priority Score</h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  The final weighted score determines the overall priority of a file. It balances access frequency (35%), recency (30%), size impact (20%), and consistency (15%) to provide a clear optimization directive.
                </p>
                <div className="p-4 bg-muted rounded-xl border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 tracking-widest">Average Score</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-400">{stats.avgPriorityScore}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis 
                      dataKey="range" 
                      stroke={chartColors.text} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: 'Score Range', position: 'insideBottom', offset: -40, fill: chartColors.text, fontSize: 12 }}
                    />
                    <YAxis 
                      stroke={chartColors.text} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: 'Files', angle: -90, position: 'insideLeft', offset: 0, fill: chartColors.text, fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{fill: chartColors.grid}}
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: `1px solid ${chartColors.tooltipBorder}`, 
                        borderRadius: '12px',
                        color: chartColors.tooltipText,
                        boxShadow: chartColors.tooltipShadow,
                        backdropFilter: 'blur(8px)'
                      }}
                      itemStyle={{ color: chartColors.tooltipText }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderWaste = () => {
    const { wasteFilesCount, totalWasteSize, topWasteFiles } = wasteStats;
    const estimatedCostWasted = (totalWasteSize / 1024) * STORAGE_COSTS.HOT[settings.costModel];
    
    const wasteChartData = [
      { name: 'Waste Data', value: totalWasteSize, color: '#ef4444' },
      { name: 'Useful Data', value: parseFloat(stats.totalSizeGB) * 1024 - totalWasteSize, color: '#6366f1' }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <SectionHeader 
          title="Storage Waste Detector" 
          description="Identify and analyze files that are unnecessarily consuming expensive storage resources."
          icon={Trash2}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Waste Files" 
            numericValue={wasteFilesCount} 
            color="bg-red-600" 
            icon={Trash2} 
            subValue="Total count"
          />
          <MetricCard 
            title="Waste Storage" 
            numericValue={totalWasteSize} 
            suffix=" MB"
            color="bg-amber-600" 
            icon={Database} 
            subValue="Unnecessary footprint"
          />
          <MetricCard 
            title="Estimated Monthly Waste" 
            numericValue={estimatedCostWasted * currencyFactor} 
            prefix={currencySymbol}
            color="bg-red-500" 
            icon={DollarSign} 
            subValue="Based on HOT pricing"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-lg font-semibold mb-8">Waste vs Useful Data</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {wasteChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: `1px solid ${chartColors.tooltipBorder}`, 
                      borderRadius: '12px',
                      color: chartColors.tooltipText,
                      boxShadow: chartColors.tooltipShadow,
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ color: chartColors.tooltipText }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Top Waste Files</h3>
              <p className="text-xs text-muted-foreground mt-1">Files with highest size and lowest priority score.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4 font-medium">File Name</th>
                    <th className="px-6 py-4 font-medium text-center">Size (MB)</th>
                    <th className="px-6 py-4 font-medium text-center">Access Count</th>
                    <th className="px-6 py-4 font-medium text-center">Last Access</th>
                    <th className="px-6 py-4 font-medium text-center">Score</th>
                    <th className="px-6 py-4 font-medium text-center">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topWasteFiles.map((file, idx) => (
                    <tr key={file.file_name + idx} className="hover:bg-muted transition-colors group">
                      <td className="px-6 py-4 font-medium text-sm">
                        <span className="text-red-400">{file.file_name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.access_count}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{file.last_access_days}d</td>
                      <td className="px-6 py-4 text-sm text-center font-mono font-bold text-red-400">
                        {(file.storage_priority_score || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400">
                          YES
                        </span>
                      </td>
                    </tr>
                  ))}
                  {topWasteFiles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No waste files detected in the current dataset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSettings = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-2xl"
    >
      <SectionHeader 
        title="Engine Settings" 
        description="Configure the optimization parameters and cost models."
        icon={SettingsIcon}
      />

      <div className="glass-card p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Enable Usage Prediction</p>
              <p className="text-xs text-muted-foreground">Use weighted scoring to predict future file access.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSettings(s => ({ ...s, enablePrediction: !s.enablePrediction }))}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.enablePrediction ? "bg-indigo-600" : "bg-white/10"
              )}
            >
              <motion.div 
                animate={{ x: settings.enablePrediction ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </motion.button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Auto-Optimization</p>
              <p className="text-xs text-muted-foreground">Automatically suggest moves when data temperature changes.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSettings(s => ({ ...s, autoOptimization: !s.autoOptimization }))}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.autoOptimization ? "bg-indigo-600" : "bg-muted"
              )}
            >
              <motion.div 
                animate={{ x: settings.autoOptimization ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </motion.button>
          </div>
        </div>

        <div className="pt-8 border-t border-border space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-indigo-400" />
            <h4 className="font-bold">Email Reporting</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Enter Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. admin@company.com"
                value={settings.emailAddress}
                onChange={(e) => setSettings(s => ({ ...s, emailAddress: e.target.value }))}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Enable Auto Email Reports</p>
                <p className="text-xs text-muted-foreground">Automatically send reports after each analysis.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSettings(s => ({ ...s, enableAutoEmailReports: !s.enableAutoEmailReports }))}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  settings.enableAutoEmailReports ? "bg-indigo-600" : "bg-muted"
                )}
              >
                <motion.div 
                  animate={{ x: settings.enableAutoEmailReports ? 24 : 0 }}
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </motion.button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Email Frequency</label>
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                  <motion.button
                    key={freq}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSettings(s => ({ ...s, emailFrequency: freq as any }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all btn-glow",
                      settings.emailFrequency === freq ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {freq}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogout()}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 mt-4"
            >
              <LogOut size={16} />
              Logout
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSendReport()}
              disabled={!settings.emailAddress || data.length === 0}
              className={cn(
                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                (!settings.emailAddress || data.length === 0) 
                  ? "bg-white/5 text-muted-foreground cursor-not-allowed" 
                  : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-600/30"
              )}
            >
              <Mail size={16} />
              Send Report Now
            </motion.button>
          </div>
        </div>

        <div className="pt-8 border-t border-border space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold">Cloud Pricing Model</label>
            <select 
              value={settings.costModel}
              onChange={(e) => setSettings(s => ({ ...s, costModel: e.target.value as any }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            >
              <option value="Low">Low Cost (Regional/Startup)</option>
              <option value="Medium">Medium Cost (Standard Enterprise)</option>
              <option value="High">High Cost (Premium/Multi-region)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">Display Currency</label>
            <div className="flex gap-2">
              {['USD', 'INR'].map((curr) => (
                <motion.button
                  key={curr}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSettings(s => ({ ...s, currency: curr as any }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    settings.currency === curr ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {curr}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <GlobalBackground />
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderLogin()}
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex relative overflow-hidden"
          >
            {/* Sidebar */}
          <aside className="w-64 border-r border-border p-6 flex flex-col gap-8 hidden md:flex sticky top-0 h-screen" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Database className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Storedge</h1>
            </div>

            <nav className="flex flex-col gap-2">
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <SidebarItem 
                icon={FileText} 
                label="File Analysis" 
                active={activeTab === 'analysis'} 
                onClick={() => setActiveTab('analysis')} 
              />
              <SidebarItem 
                icon={Trash2} 
                label="Waste Detector" 
                active={activeTab === 'waste'} 
                onClick={() => setActiveTab('waste')} 
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Detailed Analysis" 
                active={activeTab === 'detailed'} 
                onClick={() => setActiveTab('detailed')} 
              />
              <SidebarItem 
                icon={TrendingDown} 
                label="Cost Savings" 
                active={activeTab === 'cost'} 
                onClick={() => setActiveTab('cost')} 
              />
              <SidebarItem 
                icon={Zap} 
                label="What-If Simulator" 
                active={activeTab === 'simulator'} 
                onClick={() => setActiveTab('simulator')} 
              />
              <SidebarItem 
                icon={SettingsIcon} 
                label="Settings" 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
              />
            </nav>

            <div className="mt-auto glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">System Status</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Optimization Engine v2.4.0 active. Monitoring storage patterns.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            <header className="flex justify-between items-center mb-12">
              <motion.div
                key={activeTab + "-header"}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--header-gradient-from)] to-[var(--header-gradient-to)]">
                  {activeTab === 'dashboard' && "Storage Overview"}
                  {activeTab === 'analysis' && "File Analysis"}
                  {activeTab === 'waste' && "Storage Waste Detector"}
                  {activeTab === 'detailed' && "Detailed Analysis"}
                  {activeTab === 'cost' && "Savings Dashboard"}
                  {activeTab === 'simulator' && "What-If Simulator"}
                  {activeTab === 'settings' && "Engine Settings"}
                </h2>
                <p className="text-muted-foreground mt-2 text-lg font-medium">
                  {activeTab === 'dashboard' && "Real-time storage efficiency and cost insights."}
                  {activeTab === 'analysis' && "Deep dive into individual file usage and predictions."}
                  {activeTab === 'waste' && "Identify and analyze files that are unnecessarily consuming expensive storage resources."}
                  {activeTab === 'detailed' && "Explaining the parameters behind our optimization engine."}
                  {activeTab === 'cost' && "Financial impact and ROI of tiering optimization."}
                  {activeTab === 'simulator' && "Simulate storage strategies and predict financial outcomes."}
                  {activeTab === 'settings' && "Configure optimization rules and global parameters."}
                </p>
              </motion.div>

              <div className="flex items-center gap-5">
                <motion.button
                  whileHover={{ scale: 1.1, y: -4, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-3 glass-card flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-colors btn-glow"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.button>

                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Engine Active</span>
                </div>
                
                <motion.label 
                  whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 40px -10px rgba(79, 70, 229, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/30 btn-glow"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {isProcessing ? "Processing..." : "Upload CSV"}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </motion.label>

                {activeTab === 'analysis' && data.length > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportExcel}
                    className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 border border-white/10 shadow-xl"
                  >
                    <Download size={20} />
                    Export to Excel
                  </motion.button>
                )}
              </div>
            </header>

            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.8 }}
                  className="fixed bottom-12 right-12 z-[100] bg-emerald-600 text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border border-emerald-400/30 backdrop-blur-xl"
                >
                  <div className="bg-white/20 p-2 rounded-2xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">{successMessage.title}</p>
                    <p className="text-xs opacity-80 mt-0.5">{successMessage.description}</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSuccess(false)}
                    className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (showEmptyState ? '-empty' : '-content')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {showEmptyState && activeTab !== 'settings' ? renderEmptyState() : (
                  <>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'analysis' && renderAnalysis()}
                    {activeTab === 'waste' && renderWaste()}
                    {activeTab === 'detailed' && renderDetailedAnalysis()}
                    {activeTab === 'cost' && renderCost()}
                    {activeTab === 'simulator' && renderSimulator()}
                    {activeTab === 'settings' && renderSettings()}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
