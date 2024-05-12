extends Control

func _ready() -> void:
	pass # Replace with function body.


func _on_DeleteAccountButton_pressed() -> void:
	var delete_account_input = get_node("PanelContainer/HBoxContainer/VBoxContainer/DeleteAccountInput")
	var log_label = get_node("PanelContainer/HBoxContainer/VBoxContainer/Log")
	
	if delete_account_input.text == "DELETE":
		log_label.text = "Account deletion in progress"
	else:
		log_label.text = "Spell DELETE correctly"


func _on_BackButton_pressed() -> void:
	if SessionManager.role == "TEACHER":
		get_tree().change_scene("res://Menu/Teacher/TeacherMenu.tscn")
	elif SessionManager.role == "STUDENT":
		get_tree().change_scene("res://Menu/Student/StudentMenu.tscn")
	else:
		get_tree().change_scene("res://Authentication/Login.tscn")


