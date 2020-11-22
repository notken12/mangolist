
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
                    this.el = el;
                }
                addTask(task) {
                    this.tasks.push(task);
                    this.done = false;
                }
                getTaskObjectsForDb() {
                    var result = [];
                    this.tasks.forEach(function(task){
                        result.push({
                            content: task.content,
                            done: task.done
                        });
                    });
                    return result;
                }
            }

            const el = {
                TASKINPUT: $("#task-input"),
                CREATETASK: $("#create-task"),
                TASKAREA: $("#task-area"),
                MAINCONTAINER: $("#main-container"),
                FIREBASEUI: $("#firebaseui-auth-container"),
                CREATEGROUP: $("#create-group"),
                GROUPINPUT: $("#group-input"),
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

                    group.tasks.forEach(function (task, i) {
                        var li = document.createElement("li");
                        var p = document.createElement("p");

                        p.innerText = task.content;

                        var checkbox = document.createElement("input");
                        checkbox.type = "checkbox";

                        checkbox.checked = task.done;

                        checkbox.addEventListener("change", function () {
                            task.done = this.checked;

                            updateMainGroupDb();
                        });
                        p.addEventListener("click", function () {
                            task.done = !task.done;
                            el.updateView(group);

                            updateMainGroupDb();
                        });

                        var del = document.createElement("button");
                        del.classList.add("material-icons");
                        del.innerText = "delete";

                        del.addEventListener("click", function () {
                            group.tasks.splice(i, 1);
                            el.updateView(group);

                            updateMainGroupDb();
                        });

                        li.appendChild(checkbox);
                        li.appendChild(p);
                        li.appendChild(del);

                        ul.append(li);
                    });
                }
            }

            const userRef = db.collection("users").doc(uid);
            const taskGroups = [];
            taskGroups.updateAllViews = function () {
                taskGroups.forEach(function (group) {
                    el.updateView(group);
                });
            }

            function updateMainGroupDb () {
                userRef.update({
                    tasks: mainGroup.getTaskObjectsForDb()
                })
                .then(function() {
                    console.log("Document successfully written!");
                })
                .catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            }

            function newTaskGroup (name) {
                var group = new TaskGroup(name);
                taskGroups.push(group);

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
                .catch(function(error) {
                    console.error("Error adding document: ", error);
                });

                
            }

            const mainGroup = new TaskGroup("Tasks");
            const d = new TaskGroup("bruh tasks");

            taskGroups.push(mainGroup);

            d.addTask(new Task("pet mango"));

            taskGroups.updateAllViews();

            function newTaskFromInput() {
                if (isNullOrWhitespace(el.TASKINPUT.val()))
                    return;

                var task = new Task(el.TASKINPUT.val());
                mainGroup.addTask(task);

                el.TASKINPUT.val("");
                el.updateView(mainGroup);

                updateMainGroupDb();
            }

            function newTaskGroupFromInput() {
                if (isNullOrWhitespace(el.GROUPINPUT.val()))
                    return;

                newTaskGroup(el.GROUPINPUT.val());
                el.GROUPINPUT.val("");
            }

            el.CREATETASK.click(newTaskFromInput);
            el.TASKINPUT.keypress(function (e) {
                if (e.key == "Enter") {
                    newTaskFromInput();
                }
            });

            el.CREATEGROUP.click(newTaskGroupFromInput);



            userRef.update({
                displayName: user.displayName,
                email: user.email,
                //password: user.password
            })
            .then(function() {
                console.log("Document successfully written!");
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });

            userRef.get().then(function (doc) {
                if (doc.exists) {
                    var tasks = doc.data().tasks;
                    if (tasks != null) {
                        tasks.forEach(function (task) {
                            if (task.content) {
                                mainGroup.tasks.push(new Task(task.content, task.done));
                            } else{
                                mainGroup.tasks.push(new Task(task));

                            }
                        });
                    }
                    var groupIds = doc.data().taskgroups;
                    if (groupIds != null) {
                        groupIds.forEach(function (groupId) {
                            db.collection("taskgroups").doc(groupId)
                                .onSnapshot(function (doc) {
                                    var group = doc.data();
                                    var g = new TaskGroup(group.name, [], group.done, doc.id);
                                    group.tasks.forEach(function (task) {
                                        g.tasks.push(new Task(task.name, task.done));
                                    });

                                    taskGroups.push(g);
                                    el.updateView(g);
                                });

                        });
                    }
                    

                    el.updateView(mainGroup);
                }
                else {
                    //doc.data() is undefined
                    console.log("Document doesn't exist!")
                }
            }).catch(function(error) {
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