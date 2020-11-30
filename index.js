
function isNullOrWhitespace(str) {
    return (!str || str.length === 0 || /^\s*$/.test(str))
}

(function (global) {
    var auth = firebase.auth();
    var db = firebase.firestore();

    auth.onAuthStateChanged((user) => {
        if (user) {

            // https://firebase.google.com/docs/reference/js/firebase.User
            var uid = user.uid;

            class Task {
                constructor(content, done) {
                    this.content = content || "";
                    this.done = done || false;
                }
                toggleDone() {
                    this.done = !this.done;
                }
            }

            class TaskGroup {
                constructor(name, tasks, done, id, el) {
                    this.name = name || "";
                    this.tasks = tasks || [];
                    this.done = done || false;
                    this.id = id;
                    if (el) {
                        this.el = el;
                    }
                }
                addTask(task) {
                    this.tasks.push(task);
                    this.done = false;
                }
                getTaskObjectsForDb() {
                    var result = [];
                    this.tasks.forEach(function (task) {
                        result.push({
                            content: task.content,
                            done: task.done
                        });
                    });
                    return result;
                }
                updateDb() {
                    if (this.id) {
                        db.collection("taskgroups").doc(this.id).update({
                            name: this.name,
                            tasks: this.getTaskObjectsForDb(),
                            done: this.done
                        })
                            .then(function () {
                                console.log("Document successfully written!");
                            })
                            .catch(function (error) {
                                console.error("Error writing document: ", error);
                            });

                    }
                }
            }

            const el = {
                messages: {
                    NEWGROUP: "New group",
                    NEWTASK: "Add a task"
                },
                TASKINPUT: $("#task-input"),
                CREATETASK: $("#create-task"),
                TASKAREA: $("#task-area"),
                MAINCONTAINER: $("#main-container"),
                FIREBASEUI: $("#firebaseui-auth-container"),
                CREATEGROUP: $("#create-group"),
                GROUPINPUT: $("#group-input"),
                updateView: function (group) {
                    var that = this;
                    var ul, title, deleteButton, hint;

                    if (!group.el) {
                        var div = document.createElement("div");
                        group.el = $(div);
                        group.el.addClass("task-group")

                        var h2 = document.createElement("h2");
                        title = $(document.createElement("span"));
                        deleteButton = $(document.createElement("button"));

                        deleteButton.text("delete");

                        deleteButton.addClass("material-icons");
                        deleteButton.click(function () {
                            taskGroups.deleteGroup(taskGroups.indexOf(group));
                        });

                        group.el.append(h2);
                        h2.appendChild(title[0]);
                        h2.appendChild(deleteButton[0]);

                        ul = $(document.createElement("ul"));
                        group.el.append(ul);

                        hint = $(document.createElement("div"));
                        hint.text("Double-click to select and add a task");
                        hint.addClass("hint-add-task");

                        group.el.append(hint);

                        if (taskGroups.focused == taskGroups.indexOf(group)) {
                            group.el.addClass("focused");
                        }

                        group.el.dblclick(function () {
                            taskGroups.setFocus(taskGroups.indexOf(group));

                        });
                        that.TASKAREA.prepend(group.el);

                    }
                    else {
                        if (taskGroups.focused == taskGroups.indexOf(group)) {
                            group.el.addClass("focused");
                        } else {
                            group.el.removeClass("focused");
                        }

                        ul = group.el.find("ul");
                        title = group.el.find("h2 span");
                        button = group.el.find("h2 button");
                        hint = group.el.find(".hint-add-task");

                        ul.empty();
                    }

                    title.text(group.name);

                    group.tasks.forEach(function (task, i) {
                        var li = document.createElement("li");
                        var p = document.createElement("p");

                        p.innerText = task.content;

                        var checkbox = document.createElement("input");
                        checkbox.type = "checkbox";

                        checkbox.checked = task.done;

                        checkbox.addEventListener("change", function () {
                            task.done = this.checked;
                            
                            group.updateDb();
                        });
                        p.addEventListener("click", function () {
                            task.done = !task.done;
                            el.updateView(group);

                            group.updateDb();
                        });

                        var del = document.createElement("button");
                        del.classList.add("material-icons");
                        del.innerText = "delete";

                        del.addEventListener("click", function () {
                            group.tasks.splice(i, 1);
                            el.updateView(group);

                            group.updateDb();
                        });

                        li.appendChild(checkbox);
                        li.appendChild(p);
                        li.appendChild(del);

                        ul.append(li);
                    });

                    if (group.tasks.length > 0) {
                        hint.hide();
                    }
                }
            }

            const userRef = db.collection("users").doc(uid);
            const taskGroups = [];
            taskGroups.focused = -1;
            taskGroups.setFocus = function (i) {
                var prev = taskGroups.focused + 0;

                taskGroups.focused = i;

                if (i >= 0) {
                    el.updateView(taskGroups[i]);
                    el.CREATETASK.text("add_task");

                    el.TASKINPUT.attr("placeholder", el.messages.NEWTASK);
                } else {
                    el.CREATETASK.text("create_new_folder");
                    el.TASKINPUT.attr("placeholder", el.messages.NEWGROUP);
                }
                if (prev >= 0)
                    el.updateView(taskGroups[prev]);
            }

            taskGroups.deleteGroup = function (i) {
                if (i < 0) {
                    return;
                }

                var g = taskGroups[i];
                if (g == mainGroup)
                    return;
                if (g.el) 
                    g.el.remove();
                
                userRef.update({
                    taskgroups: firebase.firestore.FieldValue.arrayRemove(g.id)
                })
                .then(function () {
                    console.log("Document successfully written!");
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                });
                db.collection("taskgroups").doc(g.id).delete()
                .then(function () {
                    console.log("Document successfully written!");
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                });

                taskGroups.splice(i, 1);
                taskGroups.setFocus(-1);
            }

            taskGroups.setFocus(-1);

            taskGroups.getIndexById = function (id) {
                for (var i = 0; i < taskGroups.length; i++) {
                    if (taskGroups[i].id == id) {
                        return i;
                    }
                }
                return -1;
            }
            taskGroups.updateAllViews = function () {
                taskGroups.forEach(function (group) {
                    el.updateView(group);
                });
            }

            function newTaskGroup(name) {
                var group = new TaskGroup(name);
                taskGroups.unshift(group);
                el.updateView(group);

                var model = {
                    name: group.name,
                    tasks: [],
                    done: false,
                    users: {

                    }
                };
                model.users[uid] = {
                    admin: true
                }


                db.collection("taskgroups").add(model)
                    .then(function (docRef) {
                        group.id = docRef.id;

                        userRef.update({
                            taskgroups: firebase.firestore.FieldValue.arrayUnion(docRef.id)
                        })
                            .then(function () {
                                el.updateView(group);
                            });
                    })
                    .catch(function (error) {
                        console.error("Error adding document: ", error);
                    });


            }

            const mainGroup = new TaskGroup("My Tasks", [], false, undefined, $("#main-group"));

            mainGroup.el.dblclick(function () {
                taskGroups.setFocus(taskGroups.indexOf(mainGroup));

            });

            mainGroup.updateDb = function () {
                userRef.update({
                    tasks: mainGroup.getTaskObjectsForDb()
                })
                    .then(function () {
                        console.log("Document successfully written!");
                    })
                    .catch(function (error) {
                        console.error("Error writing document: ", error);
                    });
            }

            taskGroups.push(mainGroup);

            taskGroups.updateAllViews();

            function newTaskFromInput() {
                if (isNullOrWhitespace(el.TASKINPUT.val()))
                    return;

                if (taskGroups.focused >= 0) {
                    //add task to group

                    var g = taskGroups[taskGroups.focused];

                    var task = new Task(el.TASKINPUT.val());
                    g.addTask(task);

                    el.TASKINPUT.val("");
                    el.updateView(g);

                    g.updateDb();
                } else if (taskGroups.focused == -1) {
                    //new group
                    newTaskGroupFromInput();

                }



            }

            function newTaskGroupFromInput() {
                if (isNullOrWhitespace(el.TASKINPUT.val()))
                    return;

                newTaskGroup(el.TASKINPUT.val());
                el.TASKINPUT.val("");
            }

            el.CREATETASK.click(newTaskFromInput);
            el.TASKINPUT.keypress(function (e) {
                if (e.key == "Enter") {
                    newTaskFromInput();
                }
            });

            el.CREATEGROUP.click(newTaskGroupFromInput);

            $("body").click(function (e) {
                if (e.target == document.body || 
                    e.target == $("#title")[0] || 
                    e.target.parentElement == $("#title")[0] ||
                    e.target == el.MAINCONTAINER[0] ||
                    e.target == $("#new-task-container")[0])
                    taskGroups.setFocus(-1);
            });

            var timeoutId = 0;
            $("body").keydown(function (e) {
                if (e.key == "Escape") {
                    taskGroups.setFocus(-1);
                } else if (e.key == "Delete" && taskGroups.focused >= 0) {
                    if (taskGroups.focused >= 0 && taskGroups[taskGroups.focused] != mainGroup) {
                        taskGroups[taskGroups.focused].el.addClass("to-be-deleted");
                    }
                    timeoutId = setTimeout(function () {
                        taskGroups.deleteGroup(taskGroups.focused);
                    }, 3000);
                }
            }).keyup(function (e) {
                if (e.key == "Delete") {
                    clearTimeout(timeoutId);

                    if (taskGroups.focused >= 0 && taskGroups[taskGroups.focused] != mainGroup) {
                        taskGroups[taskGroups.focused].el.removeClass("to-be-deleted");
                    }
                }
            })

            userRef.update({
                displayName: user.displayName,
                email: user.email
            })
                .then(function () {
                    console.log("Document successfully written!");
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                });

            userRef.get().then(function (doc) {
                if (doc.exists) {
                    var tasks = doc.data().tasks;
                    if (tasks != null) {
                        tasks.forEach(function (task) {
                            if (task.content) {
                                mainGroup.tasks.push(new Task(task.content, task.done));
                            } else {
                                mainGroup.tasks.push(new Task(task));

                            }
                        });
                    }
                    var groupIds = doc.data().taskgroups;
                    if (groupIds != null) {
                        groupIds.forEach(function (groupId) {
                            db.collection("taskgroups").doc(groupId)
                                .onSnapshot(function (doc) {
                                    
                                    if (doc.exists) {
                                        var group = doc.data();
                                        var g = new TaskGroup(group.name, [], group.done, doc.id);
                                        group.tasks.forEach(function (task) {
                                            g.tasks.push(new Task(task.content, task.done));
                                        });

                                        var i = taskGroups.getIndexById(doc.id);

                                        if (i >= 0) {
                                            taskGroups[i] = Object.assign(taskGroups[i], g);
                                            el.updateView(taskGroups[i]);
                                        } else {
                                            taskGroups.push(g);
                                            el.updateView(g);
                                        }
                                    }

                                });

                        });
                    }


                    el.updateView(mainGroup);
                }
                else {
                    //doc.data() is undefined
                    console.log("Document doesn't exist!")
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });

            el.MAINCONTAINER.show();
            el.FIREBASEUI.hide();
            $("#loader").hide();
        } else {
            // User is signed out
            // ...
            var ui = new firebaseui.auth.AuthUI(firebase.auth());


            var uiConfig = {
                callbacks: {
                    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                        // User successfully signed in.
                        // Return type determines whether we continue the redirect automatically
                        // or whether we leave that to developer to handle.
                        console.log(authResult);
                        return false;
                    },
                    uiShown: function () {
                        // The widget is rendered.
                        // Hide the loader.
                        document.getElementById('loader').style.display = 'none';
                    }
                },
                // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
                signInFlow: 'redirect',
                signInSuccessUrl: '',
                signInOptions: [
                    {
                        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                        requireDisplayName: true
                    },
                    {
                        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                        scopes: [
                            'https://www.googleapis.com/auth/contacts.readonly'
                        ],
                        customParameters: {
                            // Forces account selection even when one account
                            // is available.
                            prompt: 'select_account'
                        }
                    },
                    firebase.auth.GithubAuthProvider.PROVIDER_ID
                ],
                // Terms of service url.
                //tosUrl: '<your-tos-url>',
                // Privacy policy url.
                //privacyPolicyUrl: '<your-privacy-policy-url>'
            };

            ui.start("#firebaseui-auth-container", uiConfig);
        }
    });
})(this);