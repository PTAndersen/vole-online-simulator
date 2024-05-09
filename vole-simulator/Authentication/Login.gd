extends Control

var http_request: HTTPRequest


func _ready() -> void:
	http_request = get_node("HTTPRequest") 
	http_request.connect("request_completed", self, "_on_request_completed")


func _on_Login_pressed() -> void:
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	var mail = get_node("PanelContainer/HBoxContainer/VBoxContainer/MailInput")
	var password = get_node("PanelContainer/HBoxContainer/VBoxContainer/PasswordInput")
	
	Log.text = ""
	
	if not mail or mail.text == "":
		Log.text = "Please input a mail."
		return

	if not password or password.text == "":
		Log.text = "Please input a password."
		return
	
	var password_text = password.text
	var mail_text = mail.text
	
	var login_data = {
		"email": mail_text,
		"password": password_text
	}
	print(login_data)
	var body = to_json(login_data)
	send_login_request(body)


func send_login_request(body: String) -> void:
	var error = http_request.request(
		"http://localhost:3000/api/login",  # API endpoint
		["Content-Type: application/json"],  # Necessary headers
		true,  # Use SSL for HTTPS
		HTTPClient.METHOD_POST,  # POST method
		body  # Request body as JSON string
	)

	if error != OK:
		get_node("PanelContainer/HBoxContainer/VBoxContainer/Log").text = "Failed to send request."


func _on_request_completed(result, response_code, headers, body):
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 200:
		var response = parse_json(body.get_string_from_utf8())
		Log.text = "Login successful!"
		get_tree().change_scene("res://Vole/Vole.tscn")
	else:
		Log.text = "Login failed: " + str(response_code)


func _on_Button_pressed():
	get_tree().change_scene("res://Authentication/Register.tscn")


func _on_Offline_pressed():
	get_tree().change_scene("res://Vole/Vole.tscn")
