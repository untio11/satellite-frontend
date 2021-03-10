const { override, addLessLoader, fixBabelImports } = require('customize-cra');

module.exports = {
    webpack: (config, env) => {
        //config.resolve.modules.push('externals');
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
        config.setupFiles.push('./setupJest.js');
        return config;
    },
};
