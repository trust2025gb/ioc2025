import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

// 全局导航引用，用于在组件外进行跳转/重置
export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: Record<string, unknown>) {
	if (navigationRef.isReady()) {
		navigationRef.navigate(name as never, params as never);
	}
}

export function resetToAuth() {
	if (navigationRef.isReady()) {
		navigationRef.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: 'Auth' as never }],
			})
		);
	}
} 