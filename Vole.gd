extends Control

var grid_values = []

var cpu_values = {
	"R0": "00", "R1": "00", "R2": "00", "R3": "00",
	"R4": "00", "R5": "00", "R6": "00", "R7": "00",
	"R8": "00", "R9": "00", "RA": "00", "RB": "00",
	"RC": "00", "RD": "00", "RE": "00", "RF": "00",
	"PC": "00", "IR": "0000",
}

func _ready():
	var rows = 16
	var columns = 16
	
	for row in range(rows):
		var row_values = []
		for column in range(columns):
			row_values.append("00")
		grid_values.append(row_values)
	
	populate_grid_container()
	populate_cpu_data()


func populate_cpu_data():
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

func populate_grid_container():
	var memory_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Bottom/Memory")
	
	if memory_container != null:
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


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass



func _on_Quit_pressed() -> void:
	get_tree().quit()


func _on_Run_pressed() -> void:
	populate_grid_container()
