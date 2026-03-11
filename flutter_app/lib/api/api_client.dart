import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/todo.dart';

import 'package:flutter/foundation.dart' as foundation;

class ApiClient {
  // Use 10.0.2.2 for Android Emulator, localhost for others
  static String get baseUrl {
    if (foundation.kIsWeb) {
      return 'http://localhost:3001/api';
    }
    return 'http://10.0.2.2:3001/api';
  }
  
  String? _authToken;

  bool get hasToken => _authToken != null && _authToken!.isNotEmpty;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
  }

  Future<void> setToken(String? token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('auth_token', token);
    } else {
      await prefs.remove('auth_token');
    }
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  dynamic _unwrap(http.Response response) {
    var body = jsonDecode(response.body);
    if (body is Map && body.containsKey('json')) {
      return body['json'];
    }
    return body;
  }

  Future<User> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({
        'json': {'username': username, 'password': password}
      }),
    );

    if (response.statusCode == 200) {
      return User.fromJson(_unwrap(response));
    } else {
      final errorData = _parseError(response);
      throw Exception(errorData);
    }
  }

  Future<User> register(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'json': {'username': username, 'password': password}
      }),
    );

    if (response.statusCode == 200) {
      return User.fromJson(_unwrap(response));
    } else {
      final errorData = _parseError(response);
      throw Exception(errorData);
    }
  }

  Future<User> me() async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers,
      body: jsonEncode({}),
    );

    if (response.statusCode == 200) {
      return User.fromJson(_unwrap(response));
    } else {
      throw Exception('Failed to fetch user');
    }
  }

  Future<List<Todo>> listTodos() async {
    final response = await http.post(
      Uri.parse('$baseUrl/todos/list'),
      headers: _headers,
      body: jsonEncode({}),
    );

    if (response.statusCode == 200) {
      final data = _unwrap(response);
      if (data is List) {
        return data.map((dynamic item) => Todo.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load todos');
    }
  }

  Future<Todo> createTodo(String text) async {
    final response = await http.post(
      Uri.parse('$baseUrl/todos/create'),
      headers: _headers,
      body: jsonEncode({
        'json': {'text': text}
      }),
    );

    if (response.statusCode == 200) {
      return Todo.fromJson(_unwrap(response));
    } else {
      throw Exception(_parseError(response));
    }
  }

  Future<Todo> toggleTodo(int id) async {
    final response = await http.post(
      Uri.parse('$baseUrl/todos/toggle'),
      headers: _headers,
      body: jsonEncode({
        'json': {'id': id}
      }),
    );

    if (response.statusCode == 200) {
      return Todo.fromJson(_unwrap(response));
    } else {
      throw Exception(_parseError(response));
    }
  }

  Future<void> deleteTodo(int id) async {
    final response = await http.post(
      Uri.parse('$baseUrl/todos/delete'),
      headers: _headers,
      body: jsonEncode({
        'json': {'id': id}
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  String _parseError(http.Response response) {
    try {
      var body = jsonDecode(response.body);
      // oRPC sometimes wraps in a 'json' key
      if (body is Map && body.containsKey('json')) {
        body = body['json'];
      }

      if (body is Map) {
        final message = body['message'] ?? body['error']?['message'] ?? body['msg'];
        if (message != null) return message;
        
        final data = body['data'];
        if (data is Map && data['issues'] != null) {
          final issues = data['issues'] as List;
          if (issues.isNotEmpty) {
            return 'Validation: ${issues[0]['message']}';
          }
        }
      }
      return 'Error ${response.statusCode}: ${response.body}';
    } catch (_) {
      return 'Error ${response.statusCode}: ${response.body}';
    }
  }
}
