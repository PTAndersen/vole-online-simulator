extends Control

var pc = "00"
var ir = "0000"
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
			
		var PC = Label.new()
		PC.text = "PC"
		cpu_container.add_child(PC)
		
		# Create a label for the value
		var PCValue = Label.new()
		PCValue.text = pc
		cpu_container.add_child(PCValue)
		
		var IR = Label.new()
		IR.text = "IR"
		cpu_container.add_child(IR)
		
		# Create a label for the value
		var IRValue = Label.new()
		IRValue.text = ir
		cpu_container.add_child(IRValue)
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
	populate_cpu_container()
	populate_memory_container()

func fetch() -> void:
	# Retrieve the current instruction from memory using the PC
	var current_instruction = get_memory_value_at_address(pc)
	
	# Increment PC by 1 to get the next part of the instruction
	var pc_int = hex_to_int(pc)
	pc_int = int(pc_int + 1) % 256
	pc = "%02X" % pc_int
	
	# Retrieve the next part of the instruction
	var next_instruction = get_memory_value_at_address(pc)
	
	# Combine current and next instructions into the IR
	ir = current_instruction + next_instruction
	
	# Increment the PC by 1 again to point to the instruction after the next
	pc_int = (pc_int + 1) % 256  # Update PC again
	pc = "%02X" % pc_int

	decode()

func decode() -> void:
	var opcode = ir.substr(0, 1)  # Extract opcode (assuming it's the first digit of IR)
	var operands_list = []
	# Assuming that each operand is one character long in the IR
	for i in range(1, ir.length()):
		operands_list.append(ir.substr(i, 1))
	execute(opcode, operands_list)



func execute(opcode: String, operands: Array):
	match opcode:
		"1":
			load_register_from_address(operands)
		"2":
			load_register(operands)
		"3":
			store_register(operands)
		"4":
			move_register(operands)
		"5":
			add_registers(operands)
		"6":
			add_float_registers(operands)
		"7":
			or_registers(operands)
		"8":
			and_registers(operands)
		"9":
			xor_registers(operands)
		"A":
			rotate_register(operands)
		"B":
			conditional_jump(operands)
		"C":
			halt_execution()

func load_register_from_address(operands: Array):
	var register_code = "R" + operands[0]
	var address = operands[1] + operands[2]
	var value_to_load = get_memory_value_at_address(address)
	cpu_values[register_code] = value_to_load

func load_register(operands: Array):
	var register_code = "R" + operands[0]
	var value_to_load = operands[1] + operands[2]
	cpu_values[register_code] = value_to_load

func store_register(operands: Array):
	# The register to store is the first element of operands array ('R' in 'RXY')
	var register_code = "R" + operands[0]
	var address = operands[1] + operands[2]
	var value_to_store = cpu_values[register_code]
	set_memory_value_at_address(address, value_to_store)

func move_register(operands: Array):
	var source_register_code = "R" + operands[1]
	var destination_register_code = "R" + operands[2]
	var value_to_move = cpu_values[source_register_code]
	cpu_values[destination_register_code] = value_to_move

func add_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	
	var value1 = hex_to_twos_complement_int(cpu_values[source_register_1_code])
	var value2 = hex_to_twos_complement_int(cpu_values[source_register_2_code])
	
	# Perform the addition; result wraps around at 256 to simulate 8-bit overflow
	var result = (int(value1) + int(value2)) % 256
	if result < 0:
		# Adjust for two's complement if the result is negative
		result += 256

	cpu_values[destination_register_code] = "%02X" % result

func add_float_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1_as_float = convert_hex_to_float(cpu_values[source_register_1_code])
	var value2_as_float = convert_hex_to_float(cpu_values[source_register_2_code])

	# Perform the floating-point addition
	var result = value1_as_float + value2_as_float
	
	# Convert the result back to your custom floating-point representation
	cpu_values[destination_register_code] = convert_hex_from_float(result)

func or_registers(operands: Array):
	# Extract the source registers codes and the destination register code from operands array
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = hex_to_int(cpu_values[source_register_1_code])
	var value2 = hex_to_int(cpu_values[source_register_2_code])
	var result = int(value1) | int(value2)
	cpu_values[destination_register_code] = "%02X" % result
	
func and_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = hex_to_int(cpu_values[source_register_1_code])
	var value2 = hex_to_int(cpu_values[source_register_2_code])
	var result = int(value1) & int(value2)
	cpu_values[destination_register_code] = "%02X" % result

func xor_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = hex_to_int(cpu_values[source_register_1_code])
	var value2 = hex_to_int(cpu_values[source_register_2_code])
	var result = int(value1) ^ int(value2)
	cpu_values[destination_register_code] = "%02X" % result

func rotate_register(operands: Array):
	var register_code = "R" + operands[0]
	var positions = int(operands[2])
	var value = hex_to_int(cpu_values[register_code])
	for i in range(positions):
		# Rotate right by 1 position
		# The '& 0xFF' ensures the value is treated within an 8-bit boundary after the shift
		value = (int(value) >> 1) | ((int(value) & 1) << (8 - 1))
		value &= 0xFF  # Ensure the result fits in 8 bits

	cpu_values[register_code] = "%02X" % value

func conditional_jump(operands: Array):
	var comparison_register = "R" + operands[0]
	var value_in_R0 = hex_to_int(cpu_values["R0"])
	var comparison_value = hex_to_int(cpu_values[comparison_register])
	if value_in_R0 == comparison_value:
		var new_address = operands[1] + operands[2]
		pc = new_address

func halt_execution():
	# Logic to halt CPU execution
	run_cpu = false


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	if (run_cpu):
		run_cpu_cycle()

func _on_Quit_pressed() -> void:
	get_tree().quit()

func _on_Run_pressed() -> void:
	run_cpu = true

func _on_Halt_pressed():
	run_cpu = false

func _on_Single_Step_pressed():
	run_cpu_cycle()

func _on_ClearMemory_pressed():
	reset_global_variables()

func _on_LoadData_pressed():
	var text_input_container = get_node("PanelContainer/MarginContainer/VBoxContainer/Top/TextInput")
	
	if text_input_container != null:
		var input_text = text_input_container.text
		process_input(input_text)
	else:
		print("TextInput container not found!")
		
func process_input(input_text: String):
	# Clean up input text: remove spaces and potential newlines for a cleaner process
	input_text = input_text.replace(" ", "").replace("\n", "").to_upper()
	
	# Check if input contains only hexadecimals or square brackets
	var valid_chars = "0123456789ABCDEF[]"
	for charr in input_text:
		if not charr in valid_chars:
			print("Invalid input: contains non-hexadecimal characters.")
			# TODO: Handle faulty case here
			return
	
	var current_pos = 0
	while current_pos < input_text.length():
		# Find the next operand
		var operand_start = input_text.find("[", current_pos) + 1
		var operand_end = input_text.find("]", operand_start)
		if operand_start == -1 or operand_end == -1:
			break  # Exit if no more operands
		
		var location_hex = input_text.substr(operand_start, operand_end - operand_start)
		print("Initial Location: ", location_hex)
		
		# Process pairs immediately following this operand
		var next_operand_start = input_text.find("[", operand_end)
		var pairs_text = ""
		if next_operand_start != -1:
			pairs_text = input_text.substr(operand_end + 1, next_operand_start - operand_end - 1)
		else:
			pairs_text = input_text.substr(operand_end + 1)
		
		for i in range(0, pairs_text.length(), 2):
			if i < pairs_text.length() - 1:
				var pair = pairs_text[i] + pairs_text[i + 1]
				
				# Insert pair into grid at current location
				insert_into_grid(location_hex, pair)
				
				# Increment the location for the next pair
				location_hex = increment_location_hex(location_hex)
				
		current_pos = operand_end + 1 + pairs_text.length()
		
	populate_memory_container()

func hex_to_int(hex_str: String) -> int:
	var int_value = 0
	var hex_length = hex_str.length()
	for i in range(hex_length):
		var charr = hex_str[hex_length - 1 - i]  # Start from the last character
		var digit_value = "0123456789ABCDEF".find(charr)
		if digit_value == -1:
			print("Invalid hexadecimal character: ", charr)
			return 0  # or handle the error as appropriate
		int_value += digit_value * pow(16, i)
	return int_value

func hex_to_twos_complement_int(hex_str: String) -> int:
	var int_value = hex_to_int(hex_str)
	# If the most significant bit (MSB) is set, the number is negative in two's complement
	if int(int_value) & 0x80 != 0:  # 0x80 is the hex value for 128, which is the MSB in an 8-bit number
		int_value -= 256  # Adjust for two's complement negative value
	return int_value

func convert_hex_to_float(hex_str: String) -> float:
	# Interpret the hex string as an 8-bit fixed-point value and convert it to float
	# This is a placeholder; the actual implementation will depend on your number representation
	return hex_to_int(hex_str) / 256.0  # Example: dividing by 256 to move into the range 0.0 - 1.0

func convert_hex_from_float(float_value: float) -> String:
	# Convert the float back to an 8-bit fixed-point value
	# This is a placeholder; you'll need a proper conversion based on your system
	var int_value = int(float_value * 256) % 256
	return "%02X" % int_value

func increment_location_hex(location_hex: String) -> String:
	var column = hex_to_int(location_hex[1])
	# Explicitly cast both operands to int before performing the modulus operation
	column = int(column + 1) % int(16)
	
	if column == 0:  # Column overflowed, increment row
		var row = hex_to_int(location_hex[0])
		# Again, ensure all operands are explicitly treated as integers
		row = int(row + 1) % int(16)
		return "%X%X" % [row, column]
	else:
		var row = hex_to_int(location_hex[0])  # No overflow, keep row the same
		return "%X%X" % [row, column]

func set_memory_value_at_address(hex_address: String, value: String) -> void:
	var int_address = hex_to_int(hex_address)
	var row = int(int_address / 16)
	var column = int(int_address) % 16 

	# Validate the address is within the bounds of grid_values
	if row >= 0 and row < grid_values.size() and column >= 0 and column < grid_values[0].size():
		grid_values[row][column] = value
	else:
		print("Address out of bounds: ", hex_address)

func get_memory_value_at_address(hex_address: String) -> String:
	var int_address = hex_to_int(hex_address)
	var row = int(int_address / 16)
	var column = int(int_address) % 16 


	# Validate the address is within the bounds of grid_values
	if row >= 0 and row < grid_values.size() and column >= 0 and column < grid_values[0].size():
		return grid_values[row][column]
	else:
		print("Address out of bounds: ", hex_address)
		return ""  # Return an empty string or a specific error code if out of bounds

func insert_into_grid(row_column_hex: String, value_hex: String) -> void:
	if row_column_hex.length() != 2 or value_hex.length() != 2:
		print("Invalid input format.")
		return

	# Convert row and column from hex to int
	var row = hex_to_int(row_column_hex[0])
	var column = hex_to_int(row_column_hex[1])

	# Validate row and column
	if row < 0 or row >= grid_values.size() or column < 0 or column >= grid_values[0].size():
		print("Row or column out of bounds.")
		return

	# Insert the value into the grid
	grid_values[row][column] = value_hex.to_upper()
