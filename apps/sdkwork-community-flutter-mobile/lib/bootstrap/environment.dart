class Environment {
  final String sdkBaseUrl;
  final String appApiBaseUrl;
  final String openApiBaseUrl;
  final Map<String, bool> featureFlags;

  const Environment({
    required this.sdkBaseUrl,
    required this.appApiBaseUrl,
    required this.openApiBaseUrl,
    required this.featureFlags,
  });

  static Environment get instance => const Environment(
    sdkBaseUrl: 'http://localhost:8080',
    appApiBaseUrl: 'http://localhost:8080/app/v3/api',
    openApiBaseUrl: 'http://localhost:8080/community/v3/api',
    featureFlags: {
      'community': true,
    },
  );
}