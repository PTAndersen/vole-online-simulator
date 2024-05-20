class_name AssignmentHandler
extends Object


var cpu_data
var exercise_id
var cycle_constraint
var must_use_instruction
var random_cell
var result_cell
var result_value

func _init(in_cpu_data : CPUData, exercise_data).():
	assert(in_cpu_data is CPUData)
	cpu_data = in_cpu_data
	
	exercise_id = exercise_data["id"]
	cycle_constraint = exercise_data["cycleConstraint"]
	must_use_instruction = exercise_data["mustUseInstructions"]
	random_cell = exercise_data["randomCell"]
	result_cell = exercise_data["resultCell"]
	result_value = exercise_data["resultValue"]


func _ready() -> void:
	pass # Replace with function body.

func check_success() -> bool:
	print(cpu_data.cpu_values[result_cell])
	print(result_value)
	if cpu_data.cpu_values[result_cell] == result_value:
		return true
	return false

# Called every frame. 'delta' is the elapsed time since the previous frame.
#func _process(delta: float) -> void:
#	pass
