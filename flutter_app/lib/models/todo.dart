class Todo {
  final int id;
  final String text;
  final bool done;
  final int userId;

  Todo({
    required this.id,
    required this.text,
    required this.done,
    required this.userId,
  });

  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      id: json['id'],
      text: json['text'],
      done: json['done'],
      userId: json['userId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'done': done,
      'userId': userId,
    };
  }
}
