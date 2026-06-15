import 'environment.dart';

class SdkClients {
  final String appApiBaseUrl;
  final String openApiBaseUrl;

  const SdkClients({
    required this.appApiBaseUrl,
    required this.openApiBaseUrl,
  });

  static SdkClients create() {
    final env = Environment.instance;
    return SdkClients(
      appApiBaseUrl: env.appApiBaseUrl,
      openApiBaseUrl: env.openApiBaseUrl,
    );
  }
}