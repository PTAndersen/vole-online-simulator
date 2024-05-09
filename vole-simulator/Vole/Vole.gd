extends Control

var cpu_data = CPUData.new()
var cpu_simulator = CPUSimulator.new(cpu_data)
var identifiers = [
	"R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", 
	"R8", "R9", "RA", "RB", "RC", "RD", "RE", "RF", 
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "", 
	"9", "A", "B", "C", "D", "E", "F", "PC", "IR"]


func _ready():
	cpu_data.reset_global_variables()
	populate_memory_container()
	populate_cpu_container()


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
	var cpu_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Bottom/CPUData")
	
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
	var memory_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Bottom/Memory")
	
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


func run_cpu_cycle() -> void:
	cpu_simulator.fetch()
	populate_cpu_container()
	populate_memory_container()


func _process(delta):
	if (cpu_data.run_cpu):
		run_cpu_cycle()


func _on_Quit_pressed() -> void:
	cpu_data.run_cpu = false
	get_tree().change_scene("res://Authentication/Login.tscn")


func _on_Run_pressed() -> void:
	cpu_data.run_cpu = true


func _on_Halt_pressed():
	cpu_data.run_cpu = false


func _on_Single_Step_pressed():
	run_cpu_cycle()


func _on_ClearMemory_pressed():
	cpu_data.reset_global_variables()


func _on_LoadData_pressed():
	var text_input_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Top/TextInput")
	
	if text_input_container != null:
		var input_text = text_input_container.text
		cpu_data.process_input(input_text)
		populate_memory_container()
	else:
		print("TextInput container not found!")
