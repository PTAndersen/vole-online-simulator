extends Control


var run_cpu = false
var grid_values = []

var cpu_values = {}

func _ready():
	reset_global_variables()

func reset_global_variables() -> void:
	var rows = 16
	var columns = 16
	grid_values = []
	run_cpu = false
	
	for row in range(rows):
		var row_values = []
		for column in range(columns):
			row_values.append("00")
		grid_values.append(row_values)
	
	cpu_values = {
		"R0": "00", "R1": "00", "R2": "00", "R3": "00",
		"R4": "00", "R5": "00", "R6": "00", "R7": "00",
		"R8": "00", "R9": "00", "RA": "00", "RB": "00",
		"RC": "00", "RD": "00", "RE": "00", "RF": "00",
		"PC": "00", "IR": "0000",
		}
	populate_memory_container()
	populate_cpu_container()

func populate_cpu_container():
	var cpu_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Bottom/CPUData")
	
	if cpu_container != null:
		# Clear existing children from the grid container
		for child in cpu_container.get_children():
			child.queue_free()

		# Populate the grid container with CPU register names and values
		for key in cpu_values.keys():
			# Create a label for the register name
			var label = Label.new()
			label.text = key
			cpu_container.add_child(label)
			
			# Create a label for the value
			var value = Label.new()
			value.text = cpu_values[key]
			cpu_container.add_child(value)
	else:
		print("Memory GridContainer not found!")

func populate_memory_container():
	var memory_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Bottom/Memory")
	
	if memory_container != null:
		# Clear existing children from the grid container
		for child in memory_container.get_children():
			child.queue_free()
			
		var num_rows = grid_values.size()
		var num_columns = grid_values[0].size() # Assuming all rows have the same number of columns
		
		# Create a temporary grid including labels for rows and columns
		var temp_grid = []
		
		# Add column labels (0-F) as the first row
		var first_row = [""]
		for column in range(num_columns):
			first_row.append("%X" % column)  # Convert column index to hexadecimal
		temp_grid.append(first_row)
		
		# Add row labels and grid values
		for row in range(num_rows):
			var new_row = ["%X" % row]  # Convert row index to hexadecimal and add as the first column
			new_row += grid_values[row]
			temp_grid.append(new_row)
		
		# Populate the grid container with the temporary grid
		for row in range(temp_grid.size()):
			for column in range(temp_grid[row].size()):
				var label = Label.new()
				label.text = temp_grid[row][column]
				memory_container.add_child(label)
				# Move_child is not needed since adding children in order already places them correctly
	else:
		print("Memory GridContainer not found!")

func run_cpu_cycle() -> void:
	fetch()
	decode()
	execute()
	populate_cpu_container()
	populate_memory_container()

func fetch() -> void:
	pass
	
func decode() -> void:
	pass
	
func execute() -> void:
	pass

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	if (run_cpu):
		run_cpu_cycle()

func _on_Quit_pressed() -> void:
	get_tree().quit()

func _on_Run_pressed() -> void:
	run_cpu = true

func _on_Halt_pressed():
	run_cpu = false;

func _on_Single_Step_pressed():
	run_cpu_cycle()

func _on_ClearMemory_pressed():
	reset_global_variables()

func _on_LoadData_pressed():
	var text_input_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Top/TextInput")
	
	if text_input_container != null:
		var input_text = text_input_container.text
		var lines = input_text.split("\n", false)  # Split by new lines

		for line in lines:
			var line_parts = line.split(" ")  # Split each line by space
			if line_parts.size() == 2:
				var address_with_brackets = line_parts[0]
				var data = line_parts[1]

				# Manually remove brackets from the address string
				var address = address_with_brackets.substr(1, address_with_brackets.length() - 2)
				var address_int = int("0x" + address)

				# Calculate row and column for the grid_values
				var row = address_int / 16  # Assuming 16 columns
				var column = address_int % 16
				
				if row >= 0 and row < grid_values.size() and column >= 0 and column < grid_values[0].size():
					# Update the cell in grid_values with the new data
					grid_values[row][column] = data
				else:
					print("Address out of bounds: ", address_int)
			else:
				print("Invalid format for line: ", line)
		
		populate_memory_container()
	else:
		print("TextInput container not found!")
