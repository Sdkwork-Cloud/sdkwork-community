import 'environment.dart';

class Runtime {
  final Environment environment;

  const Runtime({required this.environment});

  static Runtime create() => Runtime(environment: Environment.instance);
}