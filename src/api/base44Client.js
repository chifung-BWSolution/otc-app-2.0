/**
 * Supabase Data Layer
 * 
 * This module provides the data access API for the application,
 * exposing entity CRUD operations (filter/list/create/update/delete/get/subscribe)
 * and serverless function invocations via Supabase.
 */
import { supabase } from '@/lib/supabaseClient';

// ============================================================
// Table name mapping: EntityName -> supabase_table_name
// Adjust these if your Supabase table names differ
// ============================================================
const TABLE_MAP = {
  AdminHelpRequest: 'admin_help_request',
  AnnualReview: 'annual_review',
  AppAccessRequest: 'app_access_request',
  AppFeedback: 'app_feedback',
  AppLicenseAssignment: 'app_license_assignment',
  AppraisalReport: 'appraisal_report',
  AssessmentArrangement: 'assessment_arrangement',
  AssessmentResult: 'assessment_result',
  AssessmentTimeChangeRequest: 'assessment_time_change_request',

  BubbleClockin: 'bubble_clockin',
  BubbleLeave: 'bubble_leave',
  BubbleManHourDate: 'bubble_man_hour_date',
  BubbleManHourTask: 'bubble_man_hour_task',
  BubbleMeritsDemerits: 'bubble_merits_demerits',
  BubbleOT: 'bubble_ot',
  BubbleProject: 'bubble_project',
  BubbleStaffKPI: 'bubble_staff_kpi',
  BubbleStaffKPIMonth: 'bubble_staff_kpimonth',
  CheckInRecord: 'check_in_record',
  CompanyApp: 'company_app',
  CompanyEvent: 'company_event',
  CompanyForm: 'company_form',
  CompanyNews: 'company_news',
  ContributionType: 'contribution_type',
  Course: 'course',
  CourseCategory: 'course_category',
  CourseResource: 'course_resource',
  ExamQuestion: 'exam_question',
  ExamResult: 'exam_result',
  ExpenseRecord: 'expense_record',
  FAQItem: 'faq_item',
  FileUpload: 'file_upload',
  KnowledgeItem: 'knowledge_item',
  LeaveBalance: 'leave_balance',
  LeavePeriod: 'leave_period',
  LeaveRequest: 'bubble_leave',
  LeaveType: 'leave_type',
  MeritDemeritType: 'merit_demerit_type',
  NOSBU: 'nosbu',
  NOSDistrict: 'nosdistrict',
  NOSTask: 'nostask',
  NOSTaskType: 'nostask_type',
  NOSTeam: 'nosteam',
  NOSTeamRole: 'nosteam_role',
  Notification: 'notification',
  PeerReview: 'peer_review',
  ProfileUpdateRequest: 'profile_update_request',
  Region: 'region',
  ResourceItem: 'resource_item',
  ReviewPreset: 'review_preset',
  ScoreLevel: 'score_level',
  Staff: 'staff',
  StaffContactPerson: 'staff_contact_person',
  StaffEducation: 'staff_education',
  StaffInformation: 'staff_information',
  StaffProfile: 'staff_profile',
  StaffQAAnswer: 'staff_qaanswer',
  StaffQACategory: 'staff_qacategory',
  StaffQAQuestion: 'staff_qaquestion',
  StaffWorkExperience: 'staff_work_experience',
  SyncProgress: 'sync_progress',
  TechNews: 'tech_news',
  TenderRegistration: 'tender_registration',
  User: 'user',
  WeeklyReport: 'weekly_report',
  Workshop: 'workshop',
  WorkshopAttendance: 'workshop_attendance',
};

/**
 * Convert sort string to Supabase order params.
 * Format: "field_name" (asc) or "-field_name" (desc)
 */
function parseSort(sortStr) {
  if (!sortStr) return null;
  if (sortStr.startsWith('-')) {
    return { column: sortStr.slice(1), ascending: false };
  }
  return { column: sortStr, ascending: true };
}

/**
 * Create an entity proxy that provides .filter(), .list(), .create(), .update(), .delete(), .get(), .subscribe()
 */
function createEntityProxy(entityName) {
  const tableName = TABLE_MAP[entityName];
  if (!tableName) {
    console.warn(`[SupabaseCompat] Unknown entity: ${entityName}. Using lowercased name.`);
  }
  const table = tableName || entityName.toLowerCase();

  return {
    /**
     * filter(filterObj, sortStr, limit, offset)
     * - filterObj: { key: value } for equality filters
     * - sortStr: "field" or "-field" for desc
     * - limit: max rows (default 100)
     * - offset: skip rows (default 0)
     */
    async filter(filterObj = {}, sortStr = 'id', limit = 100, offset = 0) {
      let query = supabase.from(table).select('*');

      // Apply equality filters
      for (const [key, value] of Object.entries(filterObj)) {
        if (value === null || value === undefined) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      }

      // Apply sort
      const sort = parseSort(sortStr);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) {
        console.error(`[SupabaseCompat] filter error on ${table}:`, error.message, error.code, error.details);
        throw error;
      }
      if (!data || data.length === 0) {
        console.debug(`[SupabaseCompat] filter on ${table} returned empty`, { filterObj, sortStr });
      }
      return data || [];
    },

    /**
     * list() - returns all records (with default limit of 1000)
     */
    async list(sortStr = 'id', limit = 1000) {
      return this.filter({}, sortStr, limit, 0);
    },

    /**
     * get(id) - get single record by id
     */
    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error(`[SupabaseCompat] get error on ${table}:`, error);
        throw error;
      }
      return data;
    },

    /**
     * create(record) - insert a new record
     */
    async create(record) {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
      if (error) {
        console.error(`[SupabaseCompat] create error on ${table}:`, error);
        throw error;
      }
      return data;
    },

    /**
     * update(id, updates) - update a record by id
     */
    async update(id, updates) {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`[SupabaseCompat] update error on ${table}:`, error);
        throw error;
      }
      return data;
    },

    /**
     * delete(id) - delete a record by id
     */
    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`[SupabaseCompat] delete error on ${table}:`, error);
        throw error;
      }
      return true;
    },

    /**
     * subscribe(callback) - subscribe to realtime changes on this table
     * Returns an unsubscribe function
     */
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

// ============================================================
// Functions: base44.functions.invoke(name, params)
// Maps to Supabase Edge Functions
// ============================================================
const functionsProxy = {
  /**
   * invoke(functionName, params) - call a Supabase edge function
   * Returns just the data (unwrapped from Supabase response)
   */
  async invoke(functionName, params = {}) {
    const slug = `supabase-functions-${functionName}`;
    const { data, error } = await supabase.functions.invoke(slug, {
      body: params,
    });
    if (error) {
      // Try to extract the response body for better error messages
      let errorDetail = error.message;
      if (error.context && error.context.json) {
        try {
          const body = await error.context.json();
          errorDetail = JSON.stringify(body);
        } catch (e) { /* ignore */ }
      }
      console.warn(`[SupabaseCompat] function invoke error (${functionName}):`, errorDetail);
      throw new Error(`Edge function error (${functionName}): ${errorDetail}`);
    }
    return data;
  },
};

// ============================================================
// Auth compatibility
// ============================================================
const authProxy = {
  /**
   * me() - get current authenticated user
   */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    // Fetch role and linked_staff_id from the "user" table in DB
    let dbRole = null;
    let linkedStaffId = null;
    let dbFullName = null;
    try {
      const { data: dbUser } = await supabase
        .from('user')
        .select('role, linked_staff_id, full_name')
        .eq('email', user.email)
        .maybeSingle();
      if (dbUser) {
        dbRole = dbUser.role;
        linkedStaffId = dbUser.linked_staff_id;
        dbFullName = dbUser.full_name;
      }
    } catch (e) {
      console.warn('Failed to fetch user role from DB:', e);
    }
    // Return user info in a format compatible with what the app expects
    return {
      id: user.id,
      email: user.email,
      full_name: dbFullName || user.user_metadata?.full_name || user.user_metadata?.name || '',
      ...user.user_metadata,
      role: dbRole,
      linked_staff_id: linkedStaffId,
    };
  },

  /**
   * logout(redirectUrl) - sign out and optionally redirect
   */
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  /**
   * isAuthenticated() - check if user is currently authenticated
   */
  async isAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  },

  /**
   * redirectToLogin(returnUrl) - redirect to login page
   */
  redirectToLogin(returnUrl) {
    // Store return URL for after login
    if (returnUrl) {
      localStorage.setItem('supabase_return_url', returnUrl);
    }
    // Redirect to the login page in the app
    window.location.href = '/login';
  },
};

// ============================================================
// Create entities Proxy that dynamically creates entity accessors
// ============================================================
const entitiesProxy = new Proxy(
  {},
  {
    get(target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      // Cache entity proxies
      if (!target[entityName]) {
        target[entityName] = createEntityProxy(entityName);
      }
      return target[entityName];
    },
  }
);

// ============================================================
// Main export
// ============================================================
export const base44 = {
  entities: entitiesProxy,
  functions: functionsProxy,
  auth: authProxy,
  // For service role operations,
  // in client-side code this just uses the same client
  asServiceRole: {
    entities: entitiesProxy,
  },
};
