extends Control

var http_request: HTTPRequest
var headers = ["Content-Type: application/json", "Authorization: Bearer " + str(SessionManager.session_token)]

func _ready() -> void:
	http_request = get_node("HTTPRequest") 


func _on_CreateButton_pressed() -> void:
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	var exercise_title_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/ExerciseTitleEdit")
	var exercise_description_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/ExerciseDescriptionEdit")
	var random_cell_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/RandomValueEdit")
	var result_location_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/ResultlocationEdit")
	var result_value_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/ResultValueEdit")
	var cycle_constraint_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/CycleConstraintEdit")
	var must_instructions_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/MustInstructionsEdit")
	var correct_input_edit = get_node("PanelContainer/HBoxContainer/VBoxContainer/CorrectInputEdit")
	
	
	log_label.text = ""
	
	
	#TODO: Do check on relevant edit nodes, that they contain text
	
	var create_exercise_data = {
		"sessionToken": SessionManager.session_token,
		"classCode": SessionManager.class_code,
		"name": exercise_title_edit.text,
		"description": exercise_description_edit.text,
		"randomCell": random_cell_edit.text,
		"resultCell": result_location_edit.text,
		"resultValue": result_value_edit.text,
		"cycleConstraint": int(cycle_constraint_edit.text),
		"mustUseInstructions": must_instructions_edit.text,
	}
	var body = to_json(create_exercise_data)
	send_create_exercise_request(body)


func _on_BackButton_pressed() -> void:
	get_tree().change_scene("res://Menu/Teacher/ClassroomReview.tscn")


func send_create_exercise_request(body: String) -> void:
	http_request.connect("request_completed", self, "_on_create_exercise_completed")
	var error = http_request.request(
		"http://localhost:3000/api/create-exercise",
		["Content-Type: application/json"],
		true,  # SSL
		HTTPClient.METHOD_POST,
		body
	)
	if error != OK:
		print("Failed to send class creation request: ", error)


func _on_create_exercise_completed(result, response_code, headers, body):
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 201:
		var response = parse_json(body.get_string_from_utf8())
		log_label.text = "Exercise creation successful!"
	else:
		log_label.text = "Exercise creation failed: " + str(response_code)
	http_request.disconnect("request_completed", self, "_on_create_exercise_completed")
