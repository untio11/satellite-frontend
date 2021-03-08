module.exports = {
   webpack: function override(config, env) {
      config.resolve.modules.push('externals');
      return config;
   },
};
