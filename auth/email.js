(function (global) {

    var auth = firebase.auth();
    var db = firebase.firestore();

    $("#sign-up").click(function () {
        var email = $("#email-input").val();
        var password = $("#password-input").val();
        if (email != null && password != null) {
            auth.createUserWithEmailAndPassword(email, password)
                .then((user) => {
                    // Signed in 
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    
                });
        }
    })
})(this);