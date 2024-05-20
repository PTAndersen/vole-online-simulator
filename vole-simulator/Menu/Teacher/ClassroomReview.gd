extends Control

var http_request: HTTPRequest
var headers = ["Content-Type: application/json", "Authorization: Bearer " + str(SessionManager.session_token)]

var students = []
var exercises = []
var current_selected = ""
var current_selected_id = ""


func _ready() -> void:
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/Selected").text = "Selected: " + current_selected
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ClassLabel").text = SessionManager.classroom_name
	http_request = get_node("HTTPRequest")
	send_classroom_fetch_request(headers)


func _on_ReviewSelected_pressed() -> void:
	pass


func _on_CreateExercise_pressed() -> void:
	get_tree().change_scene("res://Menu/Teacher/ExerciseCreation.tscn")


func _on_BackButton_pressed() -> void:
	get_tree().change_scene("res://Menu/Teacher/TeacherMenu.tscn")


func _on_RemoveStudentButton_pressed() -> void:
	var remove_check = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteContainer/RemoveCheckBox")
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteContainer/Log")
	
	if remove_check.pressed:
		log_label.text = "Selected removal in progress"
	else:
		log_label.text = "Click the checkbox to enable removal"


func _on_DeleteButton_pressed() -> void:
	var delete_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteContainer/DeleteLineEdit")
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteContainer/Log2")
	
	if delete_input.text == "DELETE":
		log_label.text = "Selected deletion in progress"
		var delete_classroom_data = {
		"classCode": SessionManager.class_code,
		}
		var body = to_json(delete_classroom_data)
		send_delete_classroom_request(body)
	else:
		log_label.text = "Spell DELETE correctly"


func populate_class_data():
	var students_container = get_node("PanelContainer/HBoxContainer/VBoxContainer1/StudentsContainer")
	var exercises_container = get_node("PanelContainer/HBoxContainer/AssignmentContainer")
	for child in students_container.get_children():
		child.queue_free()

	for child in exercises_container.get_children():
		child.queue_free()	

	for i in range(students.size()):
		var button = Button.new()
		button.text = str(students[i]["firstName"] + " " + students[i]["lastName"])
		button.connect("pressed", self, "_on_student_button_pressed", [students[i]["firstName"], students[i]["lastName"]])
		button.rect_min_size.y = 20
		students_container.add_child(button)
	
	for i in range(exercises.size()):
		var button = Button.new()
		button.text = "Exercise: " + str(exercises[i]["name"])
		button.connect("pressed", self, "_on_exercise_button_pressed", [exercises[i]["name"], exercises[i]["id"]])
		button.rect_min_size.y = 20
		exercises_container.add_child(button)


func _on_student_button_pressed(student_name, student_id):
	current_selected = student_name
	current_selected_id = student_id
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/Selected").text = "Selected: " + current_selected


func _on_exercise_button_pressed(exercise_name, exercise_id):
	current_selected = exercise_name
	current_selected_id = exercise_id
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/Selected").text = "Selected: " + exercise_name


func send_classroom_fetch_request(headers: PoolStringArray) -> void:
	http_request.disconnect("request_completed", self, "_on_delete_classroom_completed")
	http_request.connect("request_completed", self, "_on_classroom_fetched")
	var error = http_request.request(
		"http://localhost:3000/api/get-classroom/" + str(SessionManager.class_code),
		headers,
		false,  # GET request does not have body; use_ssl may need to be true in production
		HTTPClient.METHOD_GET
	)
	if error != OK:
		pass


func _on_classroom_fetched(result, response_code, headers, body):
	var response = parse_json(body.get_string_from_utf8())
	if response_code == 200:
		students = response["students"]
		exercises = response["exercises"]
		populate_class_data()
	else:
		pass
	http_request.disconnect("request_completed", self, "_on_classroom_fetched")


func send_delete_classroom_request(body: String) -> void:
	http_request.disconnect("request_completed", self, "_on_classroom_fetched")
	http_request.connect("request_completed", self, "_on_delete_classroom_completed")
	var error = http_request.request(
		"http://localhost:3000/api/delete-classroom",
		headers,
		true,
		HTTPClient.METHOD_DELETE,
		body
	)
	if error != OK:
		print("Failed to send delete account request: ", error)


func _on_delete_classroom_completed(result, response_code, headers, body):
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteContainer/Log2")
	if response_code == 200:
		var response = parse_json(body.get_string_from_utf8())
		log_label.text = "Account deletion successful!"
		SessionManager.reset_session()
	else:
		log_label.text = "Account deletion failed: " + str(response_code)
	http_request.disconnect("request_completed", self, "_on_delete_classroom_completed")
