module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      "https://api.jansarthi.shubhang.dev",
  },
});
