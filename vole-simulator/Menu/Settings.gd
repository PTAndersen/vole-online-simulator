extends Control


var http_request: HTTPRequest
var headers = ["Content-Type: application/json", "Authorization: Bearer " + str(SessionManager.session_token)]


func _ready() -> void:
	http_request = get_node("HTTPRequest") 


func _on_DeleteAccountButton_pressed() -> void:
	var delete_account_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteAccountInput")
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	
	if delete_account_input.text == "DELETE":
		log_label.text = "Account deletion in progress"
		send_delete_account_request()
	else:
		log_label.text = "Spell DELETE correctly"


func _on_BackButton_pressed() -> void:
	if SessionManager.role == "TEACHER":
		get_tree().change_scene("res://Menu/Teacher/TeacherMenu.tscn")
	elif SessionManager.role == "STUDENT":
		get_tree().change_scene("res://Menu/Student/StudentMenu.tscn")
	else:
		get_tree().change_scene("res://Authentication/Login.tscn")


func send_delete_account_request() -> void:
	http_request.connect("request_completed", self, "_on_delete_account_completed")
	var error = http_request.request(
		"http://localhost:3000/api/delete-account",
		headers,
		true,
		HTTPClient.METHOD_DELETE
	)
	if error != OK:
		print("Failed to send delete account request: ", error)


func _on_delete_account_completed(result, response_code, headers, body):
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 200:
		var response = parse_json(body.get_string_from_utf8())
		log_label.text = "Account deletion successful!"
		SessionManager.reset_session()
	else:
		log_label.text = "Account deletion failed: " + str(response_code)
	http_request.disconnect("request_completed", self, "_on_delete_account_completed")
