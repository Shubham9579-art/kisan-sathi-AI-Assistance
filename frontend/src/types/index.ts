export type Language = 'mr' | 'hi' | 'en';

export interface AccountUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AppConfig {
  project_name: string;
  is_demo_mode: boolean;
  supported_languages: string[];
  demo_login_enabled: boolean;
  demo_login_otp?: string;
}

export interface WeatherDay {
  day: string;
  date: string;
  temp_max: number;
  temp_min: number;
  condition: string;
  icon: string;
  rain_probability_pct: number;
}

export interface WeatherAlert {
  severity: string;
  headline: string;
  description: string;
  suggested_action: string;
}

export interface FarmingGuidance {
  irrigation_advice: string;
  spraying_advice: string;
  harvesting_advice: string;
  soil_work_advice: string;
}

export interface RiskAssessment {
  irrigation: number;
  spraying: number;
  disease: number;
  harvesting: number;
}

export interface CropAdvisory {
  crop: string;
  growth_stage: string;
  recommendation: string;
  risk_level: string;
  action: string;
}

export interface WeatherData {
  location: string;
  district: string;
  state: string;
  temperature_celsius: number;
  feels_like_celsius: number;
  condition: string;
  humidity_pct: number;
  rainfall_prob_pct: number;
  precipitation_mm?: number;
  wind_speed_kmh: number;
  updated_at: string;
  is_demo: boolean;
  data_source_label: string;
  guidance: FarmingGuidance;
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  risk_summary?: RiskAssessment;
  recommended_actions?: string[];
  crop_advisories?: CropAdvisory[];
  advisory_summary?: string;
  weather_code?: number;
}

export interface Observation {
  id: number;
  field_id: number;
  date: string;
  growth_stage?: string;
  notes: string;
  photo_url?: string;
  created_at: string;
}

export interface FieldItem {
  id: number;
  name: string;
  location: string;
  crop: string;
  planting_date?: string;
  area: number;
  area_unit: string;
  growth_stage: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  observations: Observation[];
}

export interface ChatSource {
  title: string;
  organization: string;
  url?: string;
  note?: string;
}

export interface StructuredAdvice {
  what_might_be_happening: string;
  what_to_do_now: string[];
  what_to_monitor: string[];
  when_to_consult_expert: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  language: Language;
  is_demo: boolean;
  sources: ChatSource[];
  structured_advice?: StructuredAdvice;
  created_at: string;
}

export interface PossibleCause {
  name: string;
  confidence_level: string;
  description: string;
}

export interface CropAssessmentResult {
  assessment_id: string;
  crop_type: string;
  growth_stage?: string;
  symptoms_analyzed: string;
  is_demo: boolean;
  vision_processed: boolean;
  possible_causes: PossibleCause[];
  immediate_actions: string[];
  monitoring_points: string[];
  escalation_advice: string;
  safety_disclaimer: string;
  sources: { title: string; organization: string; url?: string }[];
  created_at: string;
}

export interface SchemeItem {
  id: string;
  name: string;
  name_mr?: string;
  name_hi?: string;
  category: string;
  description: string;
  description_mr?: string;
  description_hi?: string;
  benefits_mr?: string;
  benefits_hi?: string;
  target_beneficiaries: string;
  eligibility_criteria: string[];
  required_documents: string[];
  benefits: string;
  application_steps: string[];
  official_portal_url: string;
  last_verified: string;
  status: string;
}

export interface EligibilityCriterionResult {
  criterion: string;
  met: boolean | null;
  explanation: string;
}

export interface SchemeEvaluation {
  scheme_id: string;
  scheme_name: string;
  assessment_status: 'possible_match' | 'gaps_found';
  summary_verdict: string;
  criteria_results: EligibilityCriterionResult[];
  next_steps: string[];
  required_documents: string[];
  official_portal_url: string;
  legal_disclaimer: string;
}

export interface SchemeEligibilityResponse {
  evaluated_at: string;
  farmer_profile_summary: Record<string, any>;
  evaluations: SchemeEvaluation[];
}

export interface FarmerProfile {
  name: string;
  location: string;
  district: string;
  state: string;
  is_demo_profile: boolean;
}

export interface DashboardTask {
  id: string;
  title: string;
  category: string;
  urgency: 'High' | 'Medium' | 'Low';
  description: string;
  action_route: string;
}

export interface DashboardSummary {
  field_health_score: number;
  irrigation_window: string;
  risk_index: number;
  pest_pressure: string;
  next_action: string;
  monitoring_priority: string;
}

export interface DashboardData {
  profile: FarmerProfile;
  weather_summary: WeatherData;
  fields_count: number;
  fields: FieldItem[];
  recent_observations_count: number;
  recent_conversations: ChatMessage[];
  tasks: DashboardTask[];
  quick_tips: string[];
  system_status: Record<string, any>;
  dashboard_summary: DashboardSummary;
}
