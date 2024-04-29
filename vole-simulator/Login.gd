extends Control


# Declare member variables here. Examples:
var http_request: HTTPRequest


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	http_request = get_node("HTTPRequest")  # Make sure you have added this node in the editor
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


# Helper function to send the login HTTP request
func send_login_request(body: String) -> void:
	var error = http_request.request(
		"http://localhost:3000/api/login",  # Your API endpoint
		["Content-Type: application/json"],  # Necessary headers
		true,  # Use SSL for HTTPS
		HTTPClient.METHOD_POST,  # POST method
		body  # Request body as JSON string
	)

	if error != OK:
		get_node("PanelContainer/HBoxContainer/VBoxContainer/Log").text = "Failed to send request."


# Handle the HTTP response
func _on_request_completed(result, response_code, headers, body):
	var Log = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	if response_code == 200:
		var response = parse_json(body.get_string_from_utf8())
		# Check the response for login success or specific data
		Log.text = "Login successful!"
		get_tree().change_scene("res://Vole.tscn")
	else:
		Log.text = "Login failed: " + str(response_code)
