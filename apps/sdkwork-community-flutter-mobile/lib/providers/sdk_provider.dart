import 'package:flutter/material.dart';
import '../bootstrap/sdk_clients.dart';

class SdkProvider extends InheritedWidget {
  final SdkClients sdkClients;

  const SdkProvider({
    super.key,
    required this.sdkClients,
    required super.child,
  });

  static SdkClients of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<SdkProvider>();
    if (provider == null) {
      throw FlutterError('SdkProvider not found in context');
    }
    return provider.sdkClients;
  }

  @override
  bool updateShouldNotify(SdkProvider oldWidget) {
    return sdkClients != oldWidget.sdkClients;
  }
}