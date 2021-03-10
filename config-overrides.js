const { override, addLessLoader, fixBabelImports, useEslintRc } = require('customize-cra');

module.exports = {
    webpack: (config, env) => {
        config.resolve.modules.push('externals');
        return override(
            fixBabelImports('import', {
                libraryName: 'antd',
                libraryDirectory: 'es',
                style: true,
            }),
            addLessLoader({
                javascriptEnabled: true,
                importLoaders: true,
                modifyVars: {},
            })
        )(config, env);
    },
    jest: (config) => {
        config.transformIgnorePatterns[0] = 'node_modules/(?!(@cyclomedia|ol)/)';
        config.setupFiles.push('./setupJest.js');
        return config;
    },
};
