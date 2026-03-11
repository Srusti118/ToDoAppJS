import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/todo.dart';
import '../api/api_client.dart';

class TodoProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  User? _user;
  List<Todo> _todos = [];
  bool _isLoading = false;
  String? _error;

  TodoProvider() {
    init();
  }

  Future<void> init() async {
    _setLoading(true);
    try {
      await _apiClient.init();
      if (_apiClient.hasToken) { // I should check if hasToken exists or just use a getter
        _user = await _apiClient.me();
        await fetchTodos();
      }
    } catch (e) {
      _error = "Session expired. Please login again.";
      await logout();
    } finally {
      _setLoading(false);
    }
  }

  User? get user => _user;
  List<Todo> get todos => _todos;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> login(String username, String password) async {
    _setLoading(true);
    _error = null;
    try {
      _user = await _apiClient.login(username, password);
      await _apiClient.setToken(_user?.token);
      await fetchTodos();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> register(String username, String password) async {
    _setLoading(true);
    _error = null;
    try {
      _user = await _apiClient.register(username, password);
      await _apiClient.setToken(_user?.token);
      await fetchTodos();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _user = null;
    _todos = [];
    await _apiClient.setToken(null);
    notifyListeners();
  }

  Future<void> fetchTodos() async {
    if (_user == null) return;
    try {
      _todos = await _apiClient.listTodos();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> addTodo(String text) async {
    try {
      await _apiClient.createTodo(text);
      await fetchTodos();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> toggleTodo(int id) async {
    try {
      await _apiClient.toggleTodo(id);
      await fetchTodos();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteTodo(int id) async {
    try {
      await _apiClient.deleteTodo(id);
      await fetchTodos();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
