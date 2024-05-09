class_name CPUData
extends Object

var pc = "00"
var ir = "0000"
var run_cpu = false
var grid_values = []
var cpu_values = {}


func reset_global_variables() -> void:
	var rows = 16
	var columns = 16
	grid_values = []
	run_cpu = false
	pc = "00"
	ir = "0000"
	
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
		}


func process_input(input_text: String):
	input_text = input_text.replace(" ", "").replace("\n", "").to_upper()
	
	var valid_chars = "0123456789ABCDEF[]"
	for charr in input_text:
		if not charr in valid_chars:
			print("Invalid input: contains non-hexadecimal characters.")
			# TODO: Handle faulty case here
			return
	
	var current_pos = 0
	while current_pos < input_text.length():

		var operand_start = input_text.find("[", current_pos) + 1
		var operand_end = input_text.find("]", operand_start)
		if operand_start == -1 or operand_end == -1:
			break
		
		var location_hex = input_text.substr(operand_start, operand_end - operand_start)
		print("Initial Location: ", location_hex)
		
		var next_operand_start = input_text.find("[", operand_end)
		var pairs_text = ""
		if next_operand_start != -1:
			pairs_text = input_text.substr(operand_end + 1, next_operand_start - operand_end - 1)
		else:
			pairs_text = input_text.substr(operand_end + 1)
		
		for i in range(0, pairs_text.length(), 2):
			if i < pairs_text.length() - 1:
				var pair = pairs_text[i] + pairs_text[i + 1]
				
				insert_into_grid(location_hex, pair)
				
				location_hex = increment_location_hex(location_hex)
				
		current_pos = operand_end + 1 + pairs_text.length()


func increment_location_hex(location_hex: String) -> String:
	var column = HexUtility.hex_to_int(location_hex[1])
	column = int(column + 1) % int(16)
	
	if column == 0:
		var row = HexUtility.hex_to_int(location_hex[0])

		row = int(row + 1) % int(16)
		return "%X%X" % [row, column]
	else:
		var row = HexUtility.hex_to_int(location_hex[0])
		return "%X%X" % [row, column]


func set_memory_value_at_address(hex_address: String, value: String) -> void:
	var int_address = HexUtility.hex_to_int(hex_address)
	var row = int(int_address / 16)
	var column = int(int_address) % 16 

	if row >= 0 and row < grid_values.size() and column >= 0 and column < grid_values[0].size():
		grid_values[row][column] = value
	else:
		print("Address out of bounds: ", hex_address)


func get_memory_value_at_address(hex_address: String) -> String:
	var int_address = HexUtility.hex_to_int(hex_address)
	var row = int(int_address / 16)
	var column = int(int_address) % 16 

	if row >= 0 and row < grid_values.size() and column >= 0 and column < grid_values[0].size():
		return grid_values[row][column]
	else:
		print("Address out of bounds: ", hex_address)
		return ""


func insert_into_grid(row_column_hex: String, value_hex: String) -> void:
	if row_column_hex.length() != 2 or value_hex.length() != 2:
		print("Invalid input format.")
		return

	var row = HexUtility.hex_to_int(row_column_hex[0])
	var column = HexUtility.hex_to_int(row_column_hex[1])

	if row < 0 or row >= grid_values.size() or column < 0 or column >= grid_values[0].size():
		print("Row or column out of bounds.")
		return

	grid_values[row][column] = value_hex.to_upper()
