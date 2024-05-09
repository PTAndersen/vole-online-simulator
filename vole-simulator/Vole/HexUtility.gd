class_name HexUtility
extends Object


static func hex_to_int(hex_str: String) -> int:
	var int_value = 0
	var hex_length = hex_str.length()
	for i in range(hex_length):
		var charr = hex_str[hex_length - 1 - i]
		var digit_value = "0123456789ABCDEF".find(charr)
		if digit_value == -1:
			print("Invalid hexadecimal character: ", charr)
			return 0
		int_value += digit_value * pow(16, i)
	return int_value


static func hex_to_twos_complement_int(hex_str: String) -> int:
	var int_value = hex_to_int(hex_str)
	if int(int_value) & 0x80 != 0:
		int_value -= 256
	return int_value


static func convert_hex_to_float(hex_str: String) -> float:
	return hex_to_int(hex_str) / 256.0


static func convert_hex_from_float(float_value: float) -> String:
	var int_value = int(float_value * 256) % 256
	return "%02X" % int_value
