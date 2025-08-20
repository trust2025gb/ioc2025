const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env = {}, argv) {
	const config = await createExpoWebpackConfigAsync({ ...env, projectRoot: __dirname }, argv);
	const mode = env.mode || process.env.NODE_ENV || 'development';
	if (mode === 'production') {
		if (!config.output) config.output = {};
		config.output.publicPath = '/mobile/';
	}
	return config;
}; 