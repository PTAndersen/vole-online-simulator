extends Control

var http_request: HTTPRequest
var headers = ["Content-Type: application/json", "Authorization: Bearer " + str(SessionManager.session_token)]

var current_class = ""
var current_class_code = ""
var classes = []
var class_codes = []


func _ready() -> void:
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/SelectedClassroom").text = "Selected classroom: " + current_class
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/SelectedClassCode").text = "Selected classcode: " + current_class_code
	http_request = get_node("HTTPRequest") 
	update_classroom_list()


func _on_CreateButton_pressed() -> void:
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/AddContainer/Log")
	var create_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/AddContainer/CreateInput")
	
	log_label.text = ""
	
	if not create_input or create_input.text == "":
		log_label.text = "Please input a class name."
		return
	
	var create_class_data = {
		"sessionToken": SessionManager.session_token,
		"className": create_input.text
	}
	print(create_class_data)
	var body = to_json(create_class_data)
	send_create_class_request(body)


func _on_OfflineVersion_pressed() -> void:
	get_tree().change_scene("res://Vole/Vole.tscn")


func _on_SettingsButton_pressed() -> void:
	get_tree().change_scene("res://Menu/Settings.tscn")


func _on_LogoutButton_pressed() -> void:
	SessionManager.reset_session()
	get_tree().change_scene("res://Authentication/Login.tscn")


func update_classroom_list():
	send_classroom_fetch_request(headers)
	populate_classroom_container()

func populate_classroom_container():
	var classroom_container = get_node("PanelContainer/HBoxContainer/VBoxContainer1/ClassroomContainer")
	for child in classroom_container.get_children():
			child.queue_free()

	for i in range(classes.size()):
		var button = Button.new()
		button.text = "Class name: " + str(classes[i])
		button.connect("pressed", self, "_on_classroom_button_pressed", [classes[i], class_codes[i]])
		button.rect_min_size.y = 20
		classroom_container.add_child(button)

func _on_classroom_button_pressed(classroom_name, class_code):
	current_class = classroom_name
	current_class_code = class_code
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/SelectedClassroom").text = "Selected classroom: " + current_class
	get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/SelectedClassCode").text = "Selected classcode: " + current_class_code
	print("Selected class: ", current_class, "Code: ", current_class_code)


func send_classroom_fetch_request(headers: PoolStringArray) -> void:
	http_request.disconnect("request_completed", self, "_on_create_class_completed")
	http_request.connect("request_completed", self, "_on_classrooms_fetched")
	print("Fetching classrooms")
	var error = http_request.request(
		"http://localhost:3000/api/get-classrooms",  # API URL
		headers,  # Pass headers including Authorization
		false,  # GET request does not have body; set use_ssl to true if using https
		HTTPClient.METHOD_GET
	)
	if error != OK:
		print("Failed to send request")


func _on_classrooms_fetched(result, response_code, headers, body):
	print("Classrooms fetched")
	var response = parse_json(body.get_string_from_utf8())
	if response_code == 200:
		print("Fetched classrooms: ", response)
		classes.clear()
		class_codes.clear()
		for classroom in response["classrooms"]:
			if "name" in classroom and "classCode" in classroom:
				classes.append(classroom["name"])
				class_codes.append(classroom["classCode"])
		
		populate_classroom_container()
	else:
		print("Error fetching classrooms: ", response_code, response.get("message", ""))
	http_request.disconnect("request_completed", self, "_on_classrooms_fetched")



func send_create_class_request(body: String) -> void:
	http_request.disconnect("request_completed", self, "_on_classrooms_fetched")
	http_request.connect("request_completed", self, "_on_create_class_completed")
	var error = http_request.request(
		"http://localhost:3000/api/create-class",  # Make sure the URL is correct
		["Content-Type: application/json"],  # Headers
		true,  # SSL, change as necessary
		HTTPClient.METHOD_POST,  # Method type
		body  # JSON string body
	)
	if error != OK:
		print("Failed to send class creation request: ", error)


func _on_create_class_completed(result, response_code, headers, body):
	print("Create class complete")
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/AddContainer/Log")
	if response_code == 201:
		var response = parse_json(body.get_string_from_utf8())
		log_label.text = "Class creation successful!"
		update_classroom_list()
	else:
		log_label.text = "Class creation failed: " + str(response_code)
	http_request.disconnect("request_completed", self, "_on_create_class_completed")
	
