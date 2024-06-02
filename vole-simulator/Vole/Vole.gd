extends Control

var http_request: HTTPRequest
var headers = ["Content-Type: application/json", "Authorization: Bearer " + str(SessionManager.session_token)]

var assignments = []
var current_assignment_index

var cpu_data = CPUData.new()
var cpu_simulator = CPUSimulator.new(cpu_data)
var assignment_handler
var identifiers = [
	"R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", 
	"R8", "R9", "RA", "RB", "RC", "RD", "RE", "RF", 
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "", 
	"9", "A", "B", "C", "D", "E", "F", "PC", "IR"]
var time_running = 0
var single_step = false

func _ready():
	cpu_data.reset_global_variables()
	update_ui()
	var classroom_name = get_node("PanelContainer/MarginContainer/HBoxContainer/AssignmentsContainer/ClassName")
	classroom_name.text = SessionManager.classroom_name
	if SessionManager.session_token != "" and SessionManager.classroom_name != "":
		http_request = get_node("HTTPRequest")
		send_classroom_fetch_request(headers)


func create_colored_bg(label_text: String) -> ColorRect:
	var bg = ColorRect.new()
	bg.rect_min_size = Vector2(20, 10)
	bg.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bg.size_flags_vertical = Control.SIZE_EXPAND_FILL
	
	if label_text in identifiers:
		bg.color = Color(0.2, 0.2, 0.3)
	elif label_text == "00" or label_text == "0000":
		bg.color = Color(0.2, 0.2, 0.2)
	else:
		bg.color = Color(0.4, 0.2, 0.2) 
	return bg


func populate_cpu_container():
	var cpu_container = get_node("PanelContainer/MarginContainer/HBoxContainer/VBoxContainer/Bottom/CPUData")
	
	if cpu_container != null:
		
		var cpu_values = cpu_data.cpu_values
		
		for child in cpu_container.get_children():
			child.queue_free()

		for key in cpu_values.keys():
			var label = Label.new()
			label.align = Label.ALIGN_CENTER
			label.valign = Label.VALIGN_CENTER
			label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			label.size_flags_vertical = Control.SIZE_EXPAND_FILL
			label.text = key
			var bg = create_colored_bg(label.text)
			bg.add_child(label)
			cpu_container.add_child(bg)
			
			var value = Label.new()
			value.align = Label.ALIGN_CENTER
			value.valign = Label.VALIGN_CENTER
			value.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			value.size_flags_vertical = Control.SIZE_EXPAND_FILL
			value.text = cpu_values[key]
			var value_bg = create_colored_bg(value.text)
			value_bg.add_child(value)
			cpu_container.add_child(value_bg)
			
		var PC = Label.new()
		PC.align = Label.ALIGN_CENTER
		PC.valign = Label.VALIGN_CENTER
		PC.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		PC.size_flags_vertical = Control.SIZE_EXPAND_FILL
		PC.text = "PC"
		var PC_bg = create_colored_bg(PC.text)
		PC_bg.add_child(PC)
		cpu_container.add_child(PC_bg)
		
		var PCValue = Label.new()
		PCValue.align = Label.ALIGN_CENTER
		PCValue.valign = Label.VALIGN_CENTER
		PCValue.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		PCValue.size_flags_vertical = Control.SIZE_EXPAND_FILL
		PCValue.text = cpu_data.pc
		var PCValue_bg = create_colored_bg(PCValue.text)
		PCValue_bg.add_child(PCValue)
		cpu_container.add_child(PCValue_bg)
		
		var IR = Label.new()
		IR.align = Label.ALIGN_CENTER
		IR.valign = Label.VALIGN_CENTER
		IR.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		IR.size_flags_vertical = Control.SIZE_EXPAND_FILL
		IR.text = "IR"
		var IR_bg = create_colored_bg(IR.text)
		IR_bg.add_child(IR)
		cpu_container.add_child(IR_bg)
		
		var IRValue = Label.new()
		IRValue.align = Label.ALIGN_CENTER
		IRValue.valign = Label.VALIGN_CENTER
		IRValue.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		IRValue.size_flags_vertical = Control.SIZE_EXPAND_FILL
		IRValue.text = cpu_data.ir
		var IRValue_bg = create_colored_bg(IRValue.text)
		IRValue_bg.add_child(IRValue)
		cpu_container.add_child(IRValue_bg)
	else:
		print("Memory GridContainer not found!")


func populate_memory_container():
	var memory_container = get_node("PanelContainer/MarginContainer/HBoxContainer/VBoxContainer/Bottom/Memory")
	
	if memory_container != null:
		for child in memory_container.get_children():
			child.queue_free()

		var num_rows = cpu_data.grid_values.size()
		var num_columns = cpu_data.grid_values[0].size()

		var temp_grid = []

		var first_row = [""]
		for column in range(num_columns):
			first_row.append("%X" % column)
		temp_grid.append(first_row)

		for row in range(num_rows):
			var new_row = ["%X" % row]
			new_row += cpu_data.grid_values[row]
			temp_grid.append(new_row)

		for row in range(temp_grid.size()):
			for column in range(temp_grid[row].size()):
				var label = Label.new()
				label.align = Label.ALIGN_CENTER
				label.valign = Label.VALIGN_CENTER
				label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
				label.size_flags_vertical = Control.SIZE_EXPAND_FILL
				label.text = temp_grid[row][column]
				var bg = create_colored_bg(label.text)

				bg.add_child(label)
				memory_container.add_child(bg)
	else:
		print("Memory GridContainer not found!")


func display_assignment(assignment_index):
	var assignments_container = get_node("PanelContainer/MarginContainer/HBoxContainer/AssignmentsContainer")
	for child in assignments_container.get_children():
		child.queue_free()

	var assignment = assignments[assignment_index] 

	var exercise = assignment["exercise"]
	var exercise_name_label = Label.new()
	exercise_name_label.rect_min_size = Vector2(300, -1)
	exercise_name_label.autowrap = true
	exercise_name_label.text = "Exercise Name: " + str(exercise["name"])
	assignments_container.add_child(exercise_name_label)

	var description_label = Label.new()
	description_label.autowrap = true
	description_label.text = "Description: " + str(exercise["description"])
	assignments_container.add_child(description_label)

	var cycle_constraint_label = Label.new()
	cycle_constraint_label.autowrap = true
	cycle_constraint_label.text = "Cycle Constraint: " + str(exercise["cycleConstraint"])
	assignments_container.add_child(cycle_constraint_label)

	var must_use_instructions_label = Label.new()
	must_use_instructions_label.autowrap = true
	must_use_instructions_label.text = "Must Use Instructions: " + str(exercise["mustUseInstructions"])
	assignments_container.add_child(must_use_instructions_label)

	var random_cell_label = Label.new()
	random_cell_label.autowrap = true
	random_cell_label.text = "Random Cell: " + str(exercise["randomCell"])
	assignments_container.add_child(random_cell_label)

	var result_cell_label = Label.new()
	result_cell_label.autowrap = true
	result_cell_label.text = "Result Cell: " + str(exercise["resultCell"])
	assignments_container.add_child(result_cell_label)

	var result_value_label = Label.new()
	result_value_label.autowrap = true
	result_value_label.text = "Result Value: " + str(exercise["resultValue"])
	assignments_container.add_child(result_value_label)
	
	var status_label = Label.new()
	status_label.autowrap = true
	status_label.text = "Status: " + str(assignment["status"])
	assignments_container.add_child(status_label)
	
	var back_button = Button.new()
	back_button.text = "Back"
	back_button.rect_min_size = Vector2(100, 30)
	back_button.connect("pressed", self, "_on_back_button_pressed")
	assignments_container.add_child(back_button)


func update_ui():
	populate_cpu_container()
	populate_memory_container()
	var stats_box = get_node("PanelContainer/MarginContainer/HBoxContainer/VBoxContainer/Top/ButtonBox/Stats")
	for child in stats_box.get_children():
		child.queue_free()
	var time_running_label = Label.new()
	time_running_label.rect_min_size = Vector2(100, -1)
	time_running_label.autowrap = true
	time_running_label.text = "CPU run time:   " + str(time_running)
	stats_box.add_child(time_running_label)
	
	var cycle_count_label = Label.new()
	cycle_count_label.rect_min_size = Vector2(100, -1)
	cycle_count_label.autowrap = true
	cycle_count_label.text = "Cycle count:    " + str(cpu_data.cycle_count)
	stats_box.add_child(cycle_count_label)


func _on_back_button_pressed():
	send_classroom_fetch_request(headers)

func populate_assignment_data():
	var assignments_container = get_node("PanelContainer/MarginContainer/HBoxContainer/AssignmentsContainer")
	
	for child in assignments_container.get_children():
		child.queue_free()
	
	var class_label = Label.new()
	class_label.text = "Class: " + SessionManager.classroom_name
	assignments_container.add_child(class_label)
	
	for i in range(assignments.size()):
		var button = Button.new()
		var status = assignments[i]["status"]
		
		if status == "UNCOMPLETED":
			button.modulate = Color(1, 0.5, 0.5) 
		elif status == "COMPLETED":
			button.modulate = Color(0.5, 1, 0.5)
		
		
		button.text = "Assignment: " + str(assignments[i]["exercise"]["name"])
		button.connect("pressed", self, "_on_assignment_button_pressed", [assignments[i]["exercise"]["name"], i])
		button.rect_min_size.y = 20
		assignments_container.add_child(button)


func _on_assignment_button_pressed(assignment_name, assignment_index):
	var current_selected = assignment_name
	current_assignment_index = assignment_index
	#get_node("PanelContainer/HBoxContainer/VBoxContainer/ActionContainer/Selected").text = "Selected: " + assignment_name
	display_assignment(assignment_index)
	assignment_handler = AssignmentHandler.new(cpu_data, assignments[assignment_index]["exercise"])


func run_cpu_cycle() -> void:
	cpu_simulator.fetch()
	if assignment_handler != null and assignment_handler.check_success():
		complete_assignment()	


func _process(delta):
	if (single_step):
		cpu_data.run_cpu = true

	if (cpu_data.run_cpu):
		run_cpu_cycle()
		time_running += delta
		update_ui()
		if (single_step):
			single_step = false
			cpu_data.run_cpu = false
		


func _on_Quit_pressed() -> void:
	SessionManager.reset_class_info()
	var classroom_name = get_node("PanelContainer/MarginContainer/HBoxContainer/AssignmentsContainer/ClassName")
	cpu_data.run_cpu = false
	if SessionManager.role == "TEACHER":
		get_tree().change_scene("res://Menu/Teacher/TeacherMenu.tscn")
	elif SessionManager.role == "STUDENT":
		get_tree().change_scene("res://Menu/Student/StudentMenu.tscn")
	else:
		get_tree().change_scene("res://Authentication/Login.tscn")


func _on_Run_pressed() -> void:
	cpu_data.run_cpu = true


func _on_Halt_pressed():
	cpu_data.run_cpu = false


func _on_SingleStep_pressed():
	single_step = true


func _on_ResetCPU_pressed() -> void:
	cpu_data.reset_global_variables()
	time_running = 0
	update_ui()


func _on_LoadInput_pressed() -> void:
	var text_input_container = get_node("PanelContainer/MarginContainer/HBoxContainer/VBoxContainer/Top/TextInput")
	
	if text_input_container != null:
		var input_text = text_input_container.text
		cpu_data.process_input(input_text)
		populate_memory_container()
	else:
		print("TextInput container not found!")


func complete_assignment():
	var complete_assignment_data = {
		"classCode": SessionManager.class_code,
		"exerciseId": assignment_handler.exercise_id
	}
	var body = to_json(complete_assignment_data)
	send_completed_assignment_request(body)
	


func send_classroom_fetch_request(headers: PoolStringArray) -> void:
	http_request.disconnect("request_completed", self, "_on_completed_assignment_request")
	http_request.connect("request_completed", self, "_on_classroom_fetched")
	var error = http_request.request(
		"http://localhost:3000/api/get-classroom/" + str(SessionManager.class_code),
		headers,
		false,  # GET request does not have body; use_ssl may need to be true in production
		HTTPClient.METHOD_GET
	)
	if error != OK:
		print("Failed to send request")


func _on_classroom_fetched(result, response_code, headers, body):
	var response = parse_json(body.get_string_from_utf8())
	if response_code == 200:
		assignments = response["assignments"]
		populate_assignment_data()
	else:
		if response and response.has("message"):
			print("Error fetching classroom: ", response_code, response["message"])
		else:
			print("Error fetching classroom: ", response_code, "No additional message provided.")
	http_request.disconnect("request_completed", self, "_on_classroom_fetched")


func send_completed_assignment_request(body: String) -> void:
	http_request.disconnect("request_completed", self, "_on_classrooms_fetched")
	http_request.connect("request_completed", self, "_on_completed_assignment_request")
	var error = http_request.request(
		"http://localhost:3000/api/complete-assignment", 
		headers,
		true,  # SSL
		HTTPClient.METHOD_POST,
		body
	)
	if error != OK:
		print("Failed to send completed assignment request: ", error)


func _on_completed_assignment_request(result, response_code, headers, body):
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/AddContainer/Log")
	if response_code == 201:
		var response = parse_json(body.get_string_from_utf8())
		assignments[current_assignment_index]["status"] = "COMPLETED"
		display_assignment(current_assignment_index)
	else:
		pass
	http_request.disconnect("request_completed", self, "_on_completed_assignment_request")
