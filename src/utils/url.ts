export const getCurrentOrigin = (): string => {
	if (typeof window !== 'undefined' && window.location && window.location.origin) {
		return window.location.origin;
	}
	// 生产默认域名（用于构建环境或 SSR 情况）
	return 'https://okcrm.sdbaoyi.cn';
};

const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?(\/.*)?$/i;

const RELATIVE_ASSET_REGEXES: RegExp[] = [
	/^\/?storage\//i,
	/^\/?uploads\//i,
	/^\/?media\//i,
];

export const normalizeAssetUrl = (value: string): string => {
	if (!value) return value;
	const origin = getCurrentOrigin();
	const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';

	try {
		// 1) localhost -> 当前域名
		if (LOCALHOST_REGEX.test(value)) {
			const url = new URL(value);
			return `${protocol}//${new URL(origin).host}${url.pathname}${url.search}${url.hash}`;
		}

		// 2) 与当前域一致但为 http，统一到 https
		if (value.startsWith('http://')) {
			const url = new URL(value);
			const current = new URL(origin);
			if (url.host === current.host && protocol === 'https:') {
				return `https://${url.host}${url.pathname}${url.search}${url.hash}`;
			}
		}

		// 3) 相对路径（/storage, storage, /uploads 等） -> 拼接域名
		for (const re of RELATIVE_ASSET_REGEXES) {
			if (re.test(value)) {
				const normalizedPath = value.startsWith('/') ? value : `/${value}`;
				return `${origin}${normalizedPath}`;
			}
		}
	} catch (_) {
		// ignore
	}

	return value;
};

export const normalizeUrlsDeep = <T = any>(payload: T): T => {
	const seen = new WeakSet();

	const walk = (input: any): any => {
		if (input === null || input === undefined) return input;
		if (typeof input === 'string') {
			return normalizeAssetUrl(input);
		}
		if (typeof input !== 'object') return input;
		if (seen.has(input)) return input;
		seen.add(input);

		if (Array.isArray(input)) {
			return input.map(walk);
		}

		const output: any = Array.isArray(input) ? [] : { ...input };
		for (const key of Object.keys(input)) {
			const value = (input as any)[key];
			// 仅针对常见资源字段名字做强制规范，其他字段递归处理
			if (typeof value === 'string') {
				const lowerKey = key.toLowerCase();
				if (
					lowerKey.includes('avatar') ||
					lowerKey.includes('image') ||
					lowerKey.includes('thumbnail') ||
					lowerKey === 'url' ||
					lowerKey.endsWith('_url')
				) {
					output[key] = normalizeAssetUrl(value);
					continue;
				}
			}
			output[key] = walk(value);
		}
		return output;
	};

	return walk(payload);
}; 