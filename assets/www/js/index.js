document.addEventListener("deviceready", function() {
    $.getScript("js/nls/en-US.js", function() {
        $("#button_try").append(message.tryagain);
        if (mobil.valiteConection()) {
            var db = window.openDatabase("RDP", "1.0", "Cordova Demo", 200000);
            db.transaction(function(tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS USERS (usr_id INTEGER PRIMARY KEY ASC AUTOINCREMENT, usr_fname, usr_lname, usr_picture, usr_email, usr_refresh_token, logging_state DATE, usr_send INTEGER NOT NULL DEFAULT 0)');
            }, errorCB, function() {
                var db = window.openDatabase("RDP", "1.0", "Cordova Demo", 200000);
                db.transaction(function(tx) {
                    tx.executeSql('SELECT * FROM USERS', [], function(tx, results) {

                        $(".app_logout").on("click", function() {
                            var db = window.openDatabase("RDP", "1.0", "Cordova Demo", 200000);
                            db.transaction(function(tx) {
                                tx.executeSql('DELETE FROM USERS');
                                $.mobile.changePage("#login", {transition: "turn", changeHash: false});
                            });
                        });

                        $(".app_login").on("click", function() {
                            googleapi.authorize({
                                client_id: '300305508564.apps.googleusercontent.com',
                                client_secret: 'AKWitsWltCfLmOqt13pgDQM7',
                                redirect_uri: 'http://localhost',
                                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
                            }).done(function(data) {
                                app.send({access_token: data.access_token}).done(function(result) {

                                    var user = {
                                        given_name: result.given_name,
                                        family_name: result.family_name,
                                        picture: result.picture,
                                        email: result.email,
                                        access_token: data.access_token
                                    };
                                    var db = window.openDatabase("RDP", "1.0", "Cordova Demo", 200000);
                                    db.transaction(function(tx) {
                                        tx.executeSql('DELETE FROM USERS');
                                        tx.executeSql(
                                                'INSERT OR REPLACE INTO USERS (usr_fname, usr_lname, usr_picture, usr_email, usr_refresh_token ) VALUES ("'
                                                + user.given_name
                                                + '","'
                                                + user.family_name
                                                + '","'
                                                + user.picture
                                                + '","'
                                                + user.email
                                                + '","'
                                                + user.access_token
                                                + '")', [], function() {
                                            $.mobile.changePage("#menu", {transition: "turn", changeHash: false});
                                            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                                                var directoryReader = fileSystem.root.createReader();
                                                app.listImage(directoryReader);
                                            }, errorCB);
                                        }, errorCB);
                                    }, errorCB);
                                });
                            }).fail(function(data) {
                                $(".inner").append(data.error);
                            });
                        });

                        if (results.rows.length > 0) {
                            $.mobile.changePage("#menu", {transition: "turn", changeHash: false});
                            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                                var directoryReader = fileSystem.root.createReader();
                                app.listImage(directoryReader);
                            }, errorCB);
                        } else {
                            $.mobile.changePage("#login", {transition: "turn", changeHash: false});
                        }
                    }, errorCB);
                }, errorCB);
            });
        } else {
            $.mobile.changePage("#error_setup", {changeHash: false});
            $("#button_try").click(function() {
                $.mobile.changePage("#loading", {role: "dialog", transition: "pop", changeHash: false});
                if (mobil.valiteConection()) {
                    $.mobile.changePage("#menu", {transition: "pop", changeHash: false});
                } else {
                    $.mobile.changePage("#error_setup", {changeHash: false});
                }
            });
        }
    });
}, false);

//$(window).on("navigate", function(event, data) {
//    app.printObject(".inner", data);
//    app.printObject(".inner", data.state);
////    app.printObject(".inner", event);
//    if (data.state.url.indexOf("index.") !== -1) {
////        navigator.app.loadUrl("file:///android_asset/www/index.html");
//    }
//
//});


//$(document).bind("pagebeforechange", function(e, data) {
//    alert("CAMBIo");
//});


var googleapi = {
    authorize: function(options) {
        var deferred = $.Deferred();
        //Build the OAuth consent page URL
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
            client_id: options.client_id,
            redirect_uri: options.redirect_uri,
            scope: options.scope,
            response_type: 'code',
            access_type: 'offline',
            approval_prompt: 'force'
        });
        //Open the OAuth consent page in the InAppBrowser
        var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');
        //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
        //which sets the authorization code in the browser's title. However, we can't
        //access the title of the InAppBrowser.
        //
        //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
        //authorization code will get set in the url. We can access the url in the
        //loadstart and loadstop events. So if we bind the loadstart event, we can
        //find the authorization code and close the InAppBrowser after the user
        //has granted us access to their data.
        $(authWindow).on('loadstart', function(e) {
            var url = e.originalEvent.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);
            if (code || error) {
//Always close the browser when match is found
//                $.mobile.changePage("#loading", {role: "dialog", transition: "pop", changeHash: false});
                authWindow.close();
            }

            if (code) {
//Exchange the authorization code for an access token
                $.post('https://accounts.google.com/o/oauth2/token', {
                    code: code[1],
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                }).done(function(data) {
                    deferred.resolve(data);
                }).fail(function(response) {
                    deferred.reject(response.responseJSON);
                });
            } else if (error) {
//The user denied access to the app
                deferred.reject({
                    error: error[1]
                });
            }
        });
        return deferred.promise();
    },
    refreshToken: function(options) {
        var deferred = $.Deferred();
        $.post('https://accounts.google.com/o/oauth2/token', {
            refresh_token: options.refresh_token,
            client_id: options.client_id,
            client_secret: options.client_secret,
            grant_type: 'refresh_token'
        }).done(function(data) {
            deferred.resolve(data);
        }).fail(function(response) {
            deferred.reject(response.responseJSON);
        });
    }
};


app = {
    send: function(options) {
        var deferred = $.Deferred();
        $.ajax({
            url: "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + options.access_token,
            type: "GET",
//            contentType: "application/json; charset=UTF-8",
//            data: "access_token=" + options.access_token,
//            headers: {
//                "Authorization": "Bearer " + options.access_token,
//                "Host": "googleapis.com"
//            },
            success: function(response) {
                deferred.resolve(response);
            },
            error: function(error, errorMsg) {
                app.printObject(".inner", error);
                deferred.reject(errorMsg.responseJSON);
            }
        });
        return deferred.promise();
    },
    printObject: function(selector, object) {
        var sObje = "";
        if (object instanceof Object) {
            for (var sObjectId in object) {
                sObje += sObjectId + ":" + object[sObjectId] + "<br>";
            }
        } else {
            sObje += object + "<br>";
        }
        $(selector).append(sObje);
    },
    listImage: function(directoryReader) {
        directoryReader.readEntries($.proxy(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isFile) {
                    entries[i].file($.proxy(function(file) {
                        if (file.type === "image/jpeg" || file.type === "image/png") {
//                            this.aPathImg.push(file.fullPath);
//                            $("#imagenes").append("<li>" + file.fullPath + "</li>");
//                              this.printObject(".inner",file.fullPath);
                        }
                    }, this), errorCB);
                } else {
                    $.proxy(this.listImage(entries[i].createReader()), this);
                }
            }
        }, this), errorCB);
    }
};

function errorCB(error) {
    app.printObject(".inner", error);
}

function successCB() {
    alert(":D");
}

var mobil = {
    valiteConection: function() {
        var networkState = navigator.connection.type;
        if (Connection.WIFI === networkState || Connection.ETHERNET === networkState || Connection.CELL_3G === networkState ||
                Connection.CELL_4G === networkState) {
            return true;
        } else {
            return false;
        }
    }
};


