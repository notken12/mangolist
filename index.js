(function (global) {

    class Task {
        constructor(content, done) {
            this.content = content || "";
            this.done = done || false;
        }
    }

    class TaskGroup {
        constructor(name, tasks, done, el) {
            this.name = name || "";
            this.tasks = tasks || [];
            this.done = done || false;
            this.el = el;
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
        updateView: function (group) {
            var that = this;
            var ul, title;

            if (!group.el) {
                var div = document.createElement("div");
                group.el = $(div);
                group.el.addClass("task-group")

                title = $(document.createElement("h2"));
                group.el.append(title);

                ul = $(document.createElement("ul"));
                group.el.append(ul);
                that.TASKAREA.append(group.el);

            }
            else {

                ul = group.el.find("ul");
                title = group.el.find("h2");

                ul.empty();
            }

            title.text(group.name);

            group.tasks.forEach(function (task) {
                var li = document.createElement("li");
                var p = document.createElement("p");

                p.innerText = task.content;

                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";

                checkbox.checked = task.done;

                checkbox.addEventListener("change", function () {
                    task.done = this.checked;
                });
                p.addEventListener("click", function () {
                    task.done = !task.done;
                    el.updateView(group);
                });

                li.appendChild(checkbox);
                li.appendChild(p);

                ul.append(li);
            });
        }
    }

    function isNullOrWhitespace(str) {
        return (!str || str.length === 0 || /^\s*$/.test(str))
    }

    const taskGroups = [];
    taskGroups.updateAllViews = function () {
        taskGroups.forEach(function (group) {
            el.updateView(group);
        });
    }

    const mainGroup = new TaskGroup("Tasks");
    const d = new TaskGroup("bruh tasks");

    taskGroups.push(mainGroup);
    taskGroups.push(d);

    d.addTask(new Task("pet mango"));

    taskGroups.updateAllViews();

    function newTaskFromInput() {
        if (isNullOrWhitespace(el.TASKINPUT.val()))
            return;

        var task = new Task(el.TASKINPUT.val());
        mainGroup.addTask(task);

        el.TASKINPUT.val("");
        el.updateView(mainGroup);
    }

    el.CREATETASK.click(newTaskFromInput);
    el.TASKINPUT.keypress(function (e) {
        if (e.key == "Enter") {
            newTaskFromInput();
        }
    })
})(this);