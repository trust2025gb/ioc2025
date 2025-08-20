/**
 * 应用路由常量
 */

export const ROUTES = {
  // 认证路由
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },

  // 首页路由
  HOME: {
    DASHBOARD: 'Dashboard',
    NOTIFICATIONS: 'Notifications',
    ACTIVITIES: 'Activities',
    PRODUCTS_NAV: 'HomeProducts',
    ORDERS_NAV: 'HomeOrders',
    CONTRACTS_NAV: 'HomeContracts',
    CLAIMS_NAV: 'HomeClaims',
    SEARCH: 'GlobalSearch',
    TEAM_PERFORMANCE: 'TeamPerformance',
    MARKETING_ROI: 'MarketingRoi',
  },

  // 产品路由
  PRODUCTS: {
    LIST: 'ProductList',
    DETAIL: 'ProductDetail',
    CATEGORIES: 'ProductCategories',
    COMPARE: 'ProductCompare',
    SEARCH: 'ProductSearch',
  },

  // 线索路由
  LEADS: {
    LIST: 'LeadList',
    DETAIL: 'LeadDetail',
    CREATE: 'LeadCreate',
    EDIT: 'LeadEdit',
    STATISTICS: 'LeadStatistics',
  },

  // 订单路由
  ORDERS: {
    LIST: 'OrderList',
    DETAIL: 'OrderDetail',
    CREATE: 'OrderCreate',
    PAYMENT: 'OrderPayment',
    CONFIRMATION: 'OrderConfirmation',
  },

  // 客户路由
  CUSTOMERS: {
    LIST: 'CustomerList',
    DETAIL: 'CustomerDetail',
    CREATE: 'CustomerCreate',
    EDIT: 'CustomerEdit',
    POLICIES: 'CustomerPolicies',
    CLAIMS: 'CustomerClaims',
  },

  // 合同路由
  CONTRACTS: {
    LIST: 'ContractList',
    DETAIL: 'ContractDetail',
    CREATE: 'ContractCreate',
    EDIT: 'ContractEdit',
    SIGN: 'ContractSign',
    DOCUMENTS: 'ContractDocuments',
    TERMINATE: 'ContractTerminate',
    RENEW: 'ContractRenew',
    TEMPLATES: 'ContractTemplates',
    STATISTICS: 'ContractStatistics',
    EXPORT: 'ContractExport',
    BY_CUSTOMER: 'ContractsByCustomer',
    BY_ORDER: 'ContractsByOrder',
  },

  // 理赔路由
  CLAIMS: {
    LIST: 'ClaimList',
    DETAIL: 'ClaimDetail',
    CREATE: 'ClaimCreate',
    EDIT: 'ClaimEdit',
    DOCUMENTS: 'ClaimDocuments',
    TIMELINE: 'ClaimTimeline',
    PAYMENT: 'ClaimPayment',
    APPEAL: 'ClaimAppeal',
    STATISTICS: 'ClaimStatistics',
    BY_CUSTOMER: 'ClaimsByCustomer',
    BY_POLICY: 'ClaimsByPolicy',
  },

  // 聊天路由
    CHAT: {
     LIST: 'ChatList',
     CONVERSATION: 'ChatConversation',
     CREATE: 'ChatCreate',
     GROUP_INFO: 'ChatGroupInfo',
     SEARCH: 'ChatSearch',
     PARTICIPANTS: 'ChatParticipants',
     ATTACHMENTS: 'ChatAttachments',
     SUPPORT: 'ChatSupport',
     AI_ASSISTANT: 'ChatAiAssistant',
     SETTINGS: 'ChatSettings',
     ARCHIVED: 'ChatArchived',
   },

  EXPERTS: {
     DETAIL: 'ExpertDetail',
   },

  TASKS: {
    MY: 'MyTasks',
  },

  // 个人资料路由
  PROFILE: {
    DETAILS: 'ProfileDetails',
    EDIT: 'ProfileEdit',
    SETTINGS: 'Settings',
    CHANGE_PASSWORD: 'ChangePassword',
    TWO_FACTOR: 'TwoFactor',
    DEVICES: 'Devices',
    LOGOUT_CONFIRM: 'LogoutConfirm',
  },

  // 选项卡导航器路由
  TABS: {
    HOME_TAB: 'HomeTab',
    PRODUCTS_TAB: 'ProductsTab',
    LEADS_TAB: 'LeadsTab',
    ORDERS_TAB: 'OrdersTab',
    CUSTOMERS_TAB: 'CustomersTab',
    CONTRACTS_TAB: 'ContractsTab',
    CLAIMS_TAB: 'ClaimsTab',
    CHAT_TAB: 'ChatTab',
    PROFILE_TAB: 'ProfileTab',
  },
} as const; 