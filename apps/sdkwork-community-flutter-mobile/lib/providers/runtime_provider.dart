import 'package:flutter/material.dart';
import '../bootstrap/runtime.dart';

class RuntimeProvider extends InheritedWidget {
  final Runtime runtime;

  const RuntimeProvider({
    super.key,
    required this.runtime,
    required super.child,
  });

  static Runtime of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<RuntimeProvider>();
    if (provider == null) {
      throw FlutterError('RuntimeProvider not found in context');
    }
    return provider.runtime;
  }

  @override
  bool updateShouldNotify(RuntimeProvider oldWidget) {
    return runtime != oldWidget.runtime;
  }
}