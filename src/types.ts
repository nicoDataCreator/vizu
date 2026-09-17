export interface UserFinancialData {
  monthlyIncome: number;
  projectedAnnualIncome: number;
  incomeNotes: string;
  monthlyFixedExpenses: number;
  monthlyVariableExpenses: number;
  largeExpensesPlanned: string;
  largeExpensesAmount: number;
  primaryGoals: string[];
  travelOrExperiencePlans: string;
  travelBudget: number;
  emergencyFundMonths: number;
  emergencyFundAmount: number;
  crashCutPriorities: string[];
  debtVsReinvestStrategy: 'credit' | 'reinvest' | 'hybrid' | 'undecided';
  debtRiskRationale: string;
  customNotes?: string;
}

export interface ScenarioProjections {
  ideal: {
    name: string;
    annualRevenue: number;
    annualExpenses: number;
    netSavings: number;
    growthPct: number;
    narrative: string;
    keyMilestones: { quarter: string; title: string; target: string }[];
  };
  crash: {
    name: string;
    crashEvent: string;
    crashMonth: string;
    impactRevenueDropPct: number;
    annualRevenue: number;
    annualExpenses: number;
    netCashflow: number;
    runwayMonthsLeft: number;
    contingencyActions: string[];
    narrative: string;
  };
  crisisManagement: {
    name: string;
    recommendedFinancing: 'credit' | 'bootstrap' | 'hybrid';
    creditRecommendation: string;
    investmentAllocation: string;
    immediateCuts: string[];
    roiThreshold: string;
    immediateActionPlan: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  stepIndex?: number;
  dataSnapshot?: Partial<UserFinancialData>;
  scenarioReport?: ScenarioProjections;
  sheetValidationNotice?: string;
  thinkingProcess?: string;
}

export interface GoogleWorkspaceState {
  isConnected: boolean;
  accessToken: string | null;
  userEmail: string | null;
  activeSheetId: string | null;
  activeSheetName: string | null;
  sheetDataSummary?: {
    totalSalesDetected?: number;
    totalExpensesDetected?: number;
    projectionsDetected?: number;
    rowCount?: number;
  };
}

export interface QuestionStepDef {
  phase: number;
  phaseName: string;
  questionNumber: number;
  questionText: string;
  hint: string;
  fieldKeys: string[];
}
