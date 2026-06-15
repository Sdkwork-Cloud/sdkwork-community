class TokenManager {
  String? _token;

  String? getToken() => _token;

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }
}

class IamRuntime {
  final TokenManager tokenManager;

  const IamRuntime({required this.tokenManager});

  static IamRuntime create() => IamRuntime(tokenManager: TokenManager());
}