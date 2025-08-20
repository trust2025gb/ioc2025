/**
 * 导航类型定义
 */
import { ROUTES } from '../constants/routes';
import { ChatConversation, Message } from '../api/services/chatService';
import { Customer } from '../api/services/customerService';

// 认证导航参数类型
export type AuthStackParamList = {
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.REGISTER]: undefined;
  [ROUTES.AUTH.FORGOT_PASSWORD]: undefined;
  [ROUTES.AUTH.RESET_PASSWORD]: { token: string };
};

// 首页导航参数类型
export type HomeStackParamList = {
  [ROUTES.HOME.DASHBOARD]: undefined;
  [ROUTES.HOME.NOTIFICATIONS]: undefined;
  [ROUTES.HOME.ACTIVITIES]: undefined;
  [ROUTES.HOME.PRODUCTS_NAV]: undefined;
  [ROUTES.HOME.ORDERS_NAV]: undefined;
  [ROUTES.HOME.CONTRACTS_NAV]: undefined;
  [ROUTES.HOME.CLAIMS_NAV]: undefined;
  [ROUTES.HOME.SEARCH]: undefined;
};

// 产品导航参数类型
export type ProductsStackParamList = {
  [ROUTES.PRODUCTS.LIST]: { selectMode?: 'compare'; selectedIds?: string[] } | undefined;
  [ROUTES.PRODUCTS.DETAIL]: { id: string };
  [ROUTES.PRODUCTS.CATEGORIES]: undefined;
  [ROUTES.PRODUCTS.COMPARE]: { ids: string[] };
  [ROUTES.PRODUCTS.SEARCH]: { query?: string };
};

// 线索导航参数类型
export type LeadsStackParamList = {
  [ROUTES.LEADS.LIST]: undefined;
  [ROUTES.LEADS.DETAIL]: { id: string };
  [ROUTES.LEADS.CREATE]: { prefill?: Record<string, any> } | undefined;
  [ROUTES.LEADS.EDIT]: { id: string };
  [ROUTES.LEADS.STATISTICS]: undefined;
};

// 订单导航参数类型
export type OrdersStackParamList = {
  [ROUTES.ORDERS.LIST]: undefined;
  [ROUTES.ORDERS.DETAIL]: { id: string; orderNumber?: string };
  [ROUTES.ORDERS.CREATE]: { productId?: string; customerId?: string };
  [ROUTES.ORDERS.PAYMENT]: { id: string; amount: number };
  [ROUTES.ORDERS.CONFIRMATION]: { id: string };
};

// 客户导航参数类型
// (已在上文定义 CustomersStackParamList，避免重复定义)


// 合同导航参数类型
export type ContractsStackParamList = {
  [ROUTES.CONTRACTS.LIST]: undefined;
  [ROUTES.CONTRACTS.DETAIL]: { id: string };
  [ROUTES.CONTRACTS.CREATE]: { customerId?: string; orderId?: string };
  [ROUTES.CONTRACTS.EDIT]: { id: string };
  [ROUTES.CONTRACTS.SIGN]: { id: string; contract: any };
  [ROUTES.CONTRACTS.DOCUMENTS]: { id: string; contract: any };
  [ROUTES.CONTRACTS.TERMINATE]: { id: string };
  [ROUTES.CONTRACTS.RENEW]: { id: string };
  [ROUTES.CONTRACTS.TEMPLATES]: undefined;
  [ROUTES.CONTRACTS.STATISTICS]: undefined;
  [ROUTES.CONTRACTS.EXPORT]: { id: string };
  [ROUTES.CONTRACTS.BY_CUSTOMER]: { customerId: string };
  [ROUTES.CONTRACTS.BY_ORDER]: { orderId: string };
};

// 理赔导航参数类型
export type ClaimsStackParamList = {
  [ROUTES.CLAIMS.LIST]: undefined;
  [ROUTES.CLAIMS.DETAIL]: { id: string };
  [ROUTES.CLAIMS.CREATE]: { customerId?: string; policyId?: string };
  [ROUTES.CLAIMS.EDIT]: { id: string };
  [ROUTES.CLAIMS.DOCUMENTS]: { id: string; claim: any };
  [ROUTES.CLAIMS.TIMELINE]: { id: string };
  [ROUTES.CLAIMS.PAYMENT]: { id: string };
  [ROUTES.CLAIMS.APPEAL]: { id: string };
  [ROUTES.CLAIMS.STATISTICS]: undefined;
  [ROUTES.CLAIMS.BY_CUSTOMER]: { customerId: string };
  [ROUTES.CLAIMS.BY_POLICY]: { policyId: string };
};

// 聊天导航参数类型
export type ChatStackParamList = {
  [ROUTES.CHAT.LIST]: undefined;
  [ROUTES.CHAT.CONVERSATION]: { id: string };
  [ROUTES.CHAT.CREATE]: undefined;
  [ROUTES.CHAT.GROUP_INFO]: { id: string };
  [ROUTES.CHAT.SEARCH]: { initialQuery?: string };
  [ROUTES.CHAT.PARTICIPANTS]: { id: string };
  [ROUTES.CHAT.ATTACHMENTS]: { id: string };
  [ROUTES.CHAT.SUPPORT]: undefined;
  [ROUTES.CHAT.AI_ASSISTANT]: undefined;
  [ROUTES.CHAT.SETTINGS]: undefined;
  [ROUTES.CHAT.ARCHIVED]: undefined;
};

// 个人资料导航参数类型
export type ProfileStackParamList = {
  [ROUTES.PROFILE.DETAILS]: undefined;
  [ROUTES.PROFILE.EDIT]: undefined;
  [ROUTES.PROFILE.SETTINGS]: undefined;
  [ROUTES.PROFILE.CHANGE_PASSWORD]: undefined;
  [ROUTES.PROFILE.TWO_FACTOR]: undefined;
  [ROUTES.PROFILE.DEVICES]: undefined;
  [ROUTES.PROFILE.LOGOUT_CONFIRM]: undefined;
  Goals: undefined;
};

// 主标签导航参数类型
export type MainTabParamList = {
  [ROUTES.TABS.HOME_TAB]: undefined;
  [ROUTES.TABS.LEADS_TAB]: undefined;
  [ROUTES.TABS.CUSTOMERS_TAB]: undefined;
  [ROUTES.TABS.CHAT_TAB]: undefined;
  [ROUTES.TABS.PROFILE_TAB]: undefined;
};

// 应用导航根参数类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type ProductsTabParamList = ProductsStackParamList;
export type LeadsTabParamList = LeadsStackParamList;
export type OrdersTabParamList = OrdersStackParamList;
export type CustomersTabParamList = CustomersStackParamList;
export type ClaimsTabParamList = ClaimsStackParamList;
export type ChatTabParamList = ChatStackParamList;
export type ProfileTabParamList = ProfileStackParamList;
export type HomeTabParamList = HomeStackParamList;

// 扩展客户相关参数以便可选传递customer对象
declare module './types' {}

// 重新声明以覆盖上方定义（最小改动地在末尾追加扩展）
export type CustomersStackParamList = {
  [ROUTES.CUSTOMERS.LIST]: undefined;
  [ROUTES.CUSTOMERS.DETAIL]: { id: string };
  [ROUTES.CUSTOMERS.CREATE]: { prefill?: Record<string, any> } | undefined;
  [ROUTES.CUSTOMERS.EDIT]: { id: string; customer?: Customer };
  [ROUTES.CUSTOMERS.POLICIES]: { id: string; customer?: Customer };
  [ROUTES.CUSTOMERS.CLAIMS]: { id: string; customer?: Customer };
}; 