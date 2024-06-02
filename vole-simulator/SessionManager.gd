extends Node


var session_token = ""
var role = ""
var classroom_name = ""
var class_code = ""

func reset_session():
	session_token = ""
	role = ""
	classroom_name = ""
	class_code = ""

func reset_class_info():
	classroom_name = ""
	class_code = ""
