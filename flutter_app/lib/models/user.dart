class User {
  final int id;
  final String username;
  final String? email;
  final String? googleId;
  final String? token;

  User({
    required this.id,
    required this.username,
    this.email,
    this.googleId,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      googleId: json['googleId'],
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'googleId': googleId,
      'token': token,
    };
  }
}
