class_name CPUSimulator
extends Object

var cpu_data

func _init(in_cpu_data : CPUData).():
	assert(in_cpu_data is CPUData)
	cpu_data = in_cpu_data


func fetch() -> void:
	var current_instruction = cpu_data.get_memory_value_at_address(cpu_data.pc)
	
	var pc_int = HexUtility.hex_to_int(cpu_data.pc)
	pc_int = int(pc_int + 1) % 256
	cpu_data.pc = "%02X" % pc_int
	
	var next_instruction = cpu_data.get_memory_value_at_address(cpu_data.pc)
	
	cpu_data.ir = current_instruction + next_instruction
	
	pc_int = (pc_int + 1) % 256
	cpu_data.pc = "%02X" % pc_int
	decode()


func decode() -> void:
	var opcode = cpu_data.ir.substr(0, 1)
	var operands_list = []
	for i in range(1, cpu_data.ir.length()):
		operands_list.append(cpu_data.ir.substr(i, 1))
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
	var value_to_load = cpu_data.get_memory_value_at_address(address)
	cpu_data.cpu_values[register_code] = value_to_load


func load_register(operands: Array):
	var register_code = "R" + operands[0]
	var value_to_load = operands[1] + operands[2]
	cpu_data.cpu_values[register_code] = value_to_load


func store_register(operands: Array):
	var register_code = "R" + operands[0]
	var address = operands[1] + operands[2]
	var value_to_store = cpu_data.cpu_values[register_code]
	cpu_data.set_memory_value_at_address(address, value_to_store)


func move_register(operands: Array):
	var source_register_code = "R" + operands[1]
	var destination_register_code = "R" + operands[2]
	var value_to_move = cpu_data.cpu_values[source_register_code]
	cpu_data.cpu_values[destination_register_code] = value_to_move


func add_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	
	var value1 = HexUtility.hex_to_twos_complement_int(cpu_data.cpu_values[source_register_1_code])
	var value2 = HexUtility.hex_to_twos_complement_int(cpu_data.cpu_values[source_register_2_code])
	
	var result = (int(value1) + int(value2)) % 256
	if result < 0:
		result += 256

	cpu_data.cpu_values[destination_register_code] = "%02X" % result


func add_float_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1_as_float = HexUtility.convert_hex_to_float(cpu_data.cpu_values[source_register_1_code])
	var value2_as_float = HexUtility.convert_hex_to_float(cpu_data.cpu_values[source_register_2_code])
	var result = value1_as_float + value2_as_float
	cpu_data.cpu_values[destination_register_code] = HexUtility.convert_hex_from_float(result)


func or_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_1_code])
	var value2 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_2_code])
	var result = int(value1) | int(value2)
	cpu_data.cpu_values[destination_register_code] = "%02X" % result


func and_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_1_code])
	var value2 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_2_code])
	var result = int(value1) & int(value2)
	cpu_data.cpu_values[destination_register_code] = "%02X" % result


func xor_registers(operands: Array):
	var source_register_1_code = "R" + operands[1]
	var source_register_2_code = "R" + operands[2]
	var destination_register_code = "R" + operands[0]
	var value1 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_1_code])
	var value2 = HexUtility.hex_to_int(cpu_data.cpu_values[source_register_2_code])
	var result = int(value1) ^ int(value2)
	cpu_data.cpu_values[destination_register_code] = "%02X" % result


func rotate_register(operands: Array):
	var register_code = "R" + operands[0]
	var positions = int(operands[2])
	var value = HexUtility.hex_to_int(cpu_data.cpu_values[register_code])
	for i in range(positions):
		value = (int(value) >> 1) | ((int(value) & 1) << (8 - 1))
		value &= 0xFF

	cpu_data.cpu_values[register_code] = "%02X" % value


func conditional_jump(operands: Array):
	var comparison_register = "R" + operands[0]
	var value_in_R0 = HexUtility.hex_to_int(cpu_data.cpu_values["R0"])
	var comparison_value = HexUtility.hex_to_int(cpu_data.cpu_values[comparison_register])
	if value_in_R0 == comparison_value:
		var new_address = operands[1] + operands[2]
		cpu_data.pc = new_address


func halt_execution():
	cpu_data.run_cpu = false
