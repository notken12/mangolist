(function(global){
    class Task {
        constructor(content, done) {
            this.content = content || "";
            this.done = done || false;
        }
    }

    class TaskGroup {
        constructor(name, tasks, done) {
            this.name = name || "";
            this.tasks = tasks || [];
            this.done = done || false;
        }
        addTask(task) {
            this.tasks.push(task);
            this.done = false;
        }
    }

    const el = {
        TASKINPUT: $("#task-input"),
        CREATETASK: $("#create-task"),
        TASKAREA: $("#task-area"),
        updateView: function () {
            var that = this;

            this.TASKAREA.empty();

            taskGroups.forEach(function(group) {
                var div = document.createElement("div");
                var ul = document.createElement("ul");

                group.tasks.forEach(function(task) {
                    var li = document.createElement("li");
                    li.innerText = task.content;

                    ul.appendChild(li);
                });
                div.appendChild(ul);

                that.TASKAREA.append(div);
            });
        }
    }

    const taskGroups = [];
    const mainGroup = new TaskGroup("Tasks");

    taskGroups.push(mainGroup);

    function newTaskFromInput() {
        var task = new Task(el.TASKINPUT.val());
        mainGroup.addTask(task);

        el.TASKINPUT.val("");
        el.updateView();
    }

    el.CREATETASK.click(newTaskFromInput);
    el.TASKINPUT.keypress(function (e) {
        if (e.key == "Enter") {
            newTaskFromInput();
        }
    })
})(this);