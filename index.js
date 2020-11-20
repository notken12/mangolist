
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
                getTasksAsStrings() {
                    var result = [];
                    this.tasks.forEach(function(task){
                        result.push(task.content);
                    });
                    return result;
                }
                updateDB() {
                    
                }
            }

            const el = {
                TASKINPUT: $("#task-input"),
                CREATETASK: $("#create-task"),
                TASKAREA: $("#task-area"),
                MAINCONTAINER: $("#main-container"),
                FIREBASEUI: $("#firebaseui-auth-container"),
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
                        });
                        p.addEventListener("click", function () {
                            task.done = !task.done;
                            el.updateView(group);
                        });

                        var del = document.createElement("button");
                        del.classList.add("material-icons");
                        del.innerText = "delete";

                        del.addEventListener("click", function () {
                            group.tasks.splice(i, 1);
                            el.updateView(group);

                            db.collection("users").doc(uid).set({
                                tasks: mainGroup.getTasksAsStrings()
                            }, {merge: true})
                            .then(function() {
                                console.log("Document successfully written!");
                            })
                            .catch(function(error) {
                                console.error("Error writing document: ", error);
                            });
                        });

                        li.appendChild(checkbox);
                        li.appendChild(p);
                        li.appendChild(del);

                        ul.append(li);
                    });
                }
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

                db.collection("users").doc(uid).set({
                    tasks: mainGroup.getTasksAsStrings()
                }, {merge: true})
                .then(function() {
                    console.log("Document successfully written!");
                })
                .catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            }

            el.CREATETASK.click(newTaskFromInput);
            el.TASKINPUT.keypress(function (e) {
                if (e.key == "Enter") {
                    newTaskFromInput();
                }
            });

            db.collection("users").doc(uid).set({
                name: user.displayName,
                email: user.email,
                //password: user.password
            }, {merge: true})
            .then(function() {
                console.log("Document successfully written!");
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });

            db.collection("users").doc(uid).get().then(function (doc) {
                if (doc.exists) {
                    var tasks = doc.data().tasks;
                    tasks.forEach(function (task) {
                        mainGroup.tasks.push(new Task(task));
                    });

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