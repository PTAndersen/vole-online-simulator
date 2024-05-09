extends Control

var http_request: HTTPRequest


func _ready() -> void:
	http_request = get_node("HTTPRequest")
	http_request.connect("request_completed", self, "_on_request_completed")


func _on_Register_pressed() -> void:
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	var email_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/EmailInput")
	var password_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/PasswordInput")
	var confirm_password_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/ConfirmPasswordInput")
	
	Log.text = ""
	
	if not email_input or email_input.text == "":
		Log.text = "Please input an email."
		return
	
	if not password_input or password_input.text == "":
		Log.text = "Please input a password."
		return
	
	if password_input.text != confirm_password_input.text:
		Log.text = "Passwords do not match."
		return
	
	var registration_data = {
		"email": email_input.text,
		"password": password_input.text
	}
	var body = to_json(registration_data)
	send_registration_request(body)


func send_registration_request(body: String) -> void:
	var error = http_request.request(
		"http://localhost:3000/api/register",  # Adjust API endpoint to registration
		["Content-Type: application/json"],  # Necessary headers
		true,  # Use SSL for HTTPS (adjust as necessary)
		HTTPClient.METHOD_POST,  # POST method
		body  # Request body as JSON string
	)

	if error != OK:
		get_node("PanelContainer/HBoxContainer/VBoxContainer/Log").text = "Failed to send request."


func _on_request_completed(result, response_code, headers, body):
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 200:
		var response = parse_json(body.get_string_from_utf8())
		Log.text = "Registration successful! Please log in."
		get_tree().change_scene("res://Authentication/Login.tscn")
	else:
		Log.text = "Registration failed: " + str(response_code)


func _on_Back_pressed():
	get_tree().change_scene("res://Authentication/Login.tscn")
