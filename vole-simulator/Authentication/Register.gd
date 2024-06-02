extends Control

var http_request: HTTPRequest


func _ready() -> void:
	http_request = get_node("HTTPRequest")
	http_request.connect("request_completed", self, "_on_request_completed")


func _on_Register_pressed() -> void:
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	var firstname_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/FirstnameInput")
	var lastname_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/LastnameInput")
	var email_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/MailInput")
	var password_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/PasswordInput")
	var confirm_password_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/ConfirmPasswordInput")
	var role = "student"
	if get_node("PanelContainer/HBoxContainer/VBoxContainer/RoleCheckBox").pressed:
		role = "teacher"
		
	Log.text = ""
	
	if not firstname_input or firstname_input.text == "":
		Log.text = "Please input firstname"
		return
	
	if not lastname_input or lastname_input.text == "":
		Log.text = "Please input lastname"
		return
	
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
		"password": password_input.text,
		"firstName": firstname_input.text,
		"lastName": lastname_input.text,
		"role": role
	}
	var body = to_json(registration_data)
	send_registration_request(body)


func send_registration_request(body: String) -> void:
	var error = http_request.request(
		"http://localhost:3000/api/register",
		["Content-Type: application/json"],
		true,  # SSL
		HTTPClient.METHOD_POST, 
		body
	)

	if error != OK:
		get_node("PanelContainer/HBoxContainer/VBoxContainer/Log").text = "Failed to send request."


func _on_request_completed(result, response_code, headers, body):
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 201:
		var response = parse_json(body.get_string_from_utf8())
		if "token" in response:
			SessionManager.session_token = response["token"]
			Log.text = "Registration successful! Please log in."
			if response["role"] == "STUDENT":
				get_tree().change_scene("res://Menu/Student/StudentMenu.tscn")
			elif response["role"] == "TEACHER":
				get_tree().change_scene("res://Menu/Teacher/TeacherMenu.tscn")
		else:
			Log.text = "Login failed: Token not found in response"
	else:
		Log.text = "Login failed: " + str(response_code)

func _on_Back_pressed():
	get_tree().change_scene("res://Authentication/Login.tscn")
