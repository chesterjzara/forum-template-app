const app = angular.module('forumApp', []);

app.controller('ThreadController', ['$http','$scope', function($http, $scope){
    this.newThread = {};
    this.updatingThread = {};
    this.updatingComment = {};
    this.threads = [];
    this.deleteIndex = '';
    this.showLogin = false;
    this.showSignup = false;
    this.showAddComment = false;
    this.loginErr = false;
    this.verifyPassword = '';
    this.errorMsg = '';
    this.includePath = 'partials/main-page.html'


    // Variables to track searching, sorting, and filtering
    this.currFilter = '';
    this.currOrder = '-createdAt';
    $scope.sortLeastLikes = function(thread) {
        return parseInt(thread.likes)
    };
    $scope.sortMostLikes = function(thread) {
        return - parseInt(thread.likes)
    };

    ///////////////////////////
    //      View Switching
    //////////////////////////
    this.viewThread = '';
    this.viewUser = '';
    this.changeInclude = (path) => {
        this.includePath = 'partials/' + path + '.html';
        console.log(this.viewUser, this.viewThread);
    }

    //////////////////////////
    //     Thread Methods
    //////////////////////////
    this.createThread = () => {
        console.log(this.newThread);
        $http({
            method: "POST",
            url: "/threads",
            data: this.newThread
        }).then( (response) => {
            console.log(response);
            this.threads.unshift(response.data);
            this.newThread = {};
            this.changeInclude('main-page');
        }, (err) => {
            console.log(err.message);
        });
    }

    this.getAllThreads = () => {
        $http({
            method: 'GET',
            url: '/threads'
        }).then( (response ) => {
            this.threads = response.data;
        }, (err) => {
            console.log(err.message);
        });
    };
    this.getAllThreads();

    // this.getOneThread = (thread) => {
    //     let ret = $http({
    //         method: 'GET',
    //         url: '/threads/' + thread._id
    //     }).then( (response ) => {
    //         console.log(response.data);
    //     }, (err) => {
    //         console.log(err.message);
    //     });
    //     console.log(ret);
    // };

    this.deleteThread = (id) => {
        $http({
            method: 'DELETE',
            url: `/threads/${id}`
        }).then( (response) => {
            console.log(response);
            // this.threads.splice(this.deleteIndex);
            // this.deleteIndex = '';
            this.getAllThreads();
            this.changeInclude('main-page');
        }, (err) => {
            console.log(err.message);
        });
    }

    this.updateThread = (thread) => {
        $http({
            method: 'PUT',
            url: `/threads/${thread._id}`,
            data: thread
        }).then( (response) => {
            console.log(response);
            thread = response.data
            let index = this.threads.findIndex( (e) => {
                return e._id === thread._id;
            })
            this.threads[index] = thread;
        },  (err) => {
            console.log(err.message);
        });
    }

    //Update Likes on a Thread
    this.addThreadLike = (thread) => {
        //Check if the user is logged in first
        if(this.loggedInUser) {
            // If/else here handles if the thread has no likes yet and thus thread.likeUsers does not exist yet (and needs creation)
                //Both add the current user to the like list
            if(thread['likeUsers']) {
                thread['likeUsers'][this.loggedInUser._id] = 1;
            } else {
                thread['likeUsers'] = { };
                thread['likeUsers'][this.loggedInUser._id] = 1;
            }
            //Send the updated Thread data to the Server/DB
            this.updateThread(thread);
        }
        else {
            //If the user is not logged in, prompt them to do so first
            this.promptLoginSignup( false, false, 'Please log in or register to Like a thread!');
        }

    }
    //Edit Thread Text
    this.showThreadUpdate = (thread) => {
        this.updatingThread.content = thread.content;
        this.showThreadUpdateFields = true;
    }
    this.saveThreadUpdate = (thread) => {
        thread.content = this.updatingThread.content;
        this.updateThread(thread);
        this.showThreadUpdateFields = false;
        this.updatingThread = {};
    }
    this.cancelThreadUpdate = (thread) => {
        this.updatingThread = {};
        this.showThreadUpdateFields = false;
    }

        // Click the new post button - redirect to login or allow post
    this.newPostClick = () => {
        if(this.loggedInUser === '') {
            console.log('User not logged in - redirect to login');
            this.promptLoginSignup( false, false, 'Please log in or register to make a post!');
        } else {
            console.log('Creating post.... <show create post view here>');
            this.changeInclude('new-thread');
        }
    }

    ///////////////////////////////////
    //          Comment Methods
    ///////////////////////////////////

    //Refresh comments on thread
    this.getCommentsOnThread = (threadId) => { 
        $http({
            method: 'GET',
            url: '/threads/' + threadId,
        }).then( (response) => { 
            this.viewThread.comments = response.data.comments;
        }, (error) => { 
            console.log(error);
        })
    }

    //Add a comment to a thread
    this.addComment = (thread) => {
        $http({
            method: 'POST',
            url: '/comments/',
            data: {
                commentContent: this.newComment,
                threadRef: thread._id
            }
        }).then( (response) => { 
            thread.comments.push(response.data)
            this.newComment = '';
        })
    }

    //Generic Update Comment
    this.updateComment = (comment) => { 
        $http({
            method: 'PUT',
            url: '/comments/' + comment._id,
            data: comment
        }).then( (response) => { 
            console.log(response);
            comment = response.data
            let index = this.viewThread.comments.findIndex( (e) => {
                return e._id === comment._id;
            })
            this.viewThread.comments[index] = comment;
        }, (error) => { 
            console.log(error);
        })
    }

    //Edit Comment text
    this.showCommentUpdate = (comment) => { 
        //this.updatingComment.commentContent = comment.commentContent;
        comment.updating = {};
        comment.updating.commentContent = comment.commentContent;
        comment.showCommentUpdateFields = true;
    }
    this.saveCommentUpdate = (comment) => {
        comment.commentContent = comment.updating.commentContent;
        this.updateComment(comment);
        
        comment.showCommentUpdateFields = false;
        comment.updating = {};
    }
    this.cancelCommentUpdate = (comment) => {
        comment.updating = {};
        comment.showCommentUpdateFields = false;
    }

    //Delete Comment
    this.deleteComment = (comment) => {
        $http({
            method: 'DELETE',
            url: `/comments/${comment._id}`
        }).then( (response) => {
            console.log(response);
            // this.threads.splice(this.deleteIndex);
            // this.deleteIndex = '';
            this.getCommentsOnThread(comment.threadRef);

        }, (err) => {
            console.log(err.message);
        });
    }

    ////////////////////////////////
    //         User Auth
    ////////////////////////////////

    this.checkSession = function() {
        $http({
            method: 'GET',
            url: '/sessions/currentUser'
        }).then( (response) => {
            if (response.data) {
                this.loggedInUser = response.data;
                this.loggedIn = true;
                // this.getAllThreads();
            }
            else {
                this.loggedInUser = '';
                this.loggedIn = false;
            }
        }), (error) => {
            console.log(error.data.message);
        }
    }
    this.checkSession();

    this.createUser = () => {
        if ( this.newPassword !== this.verifyPassword ) {
            this.errorMsg = "Passwords must match";
        }
        else {
            $http({
                method: 'POST',
                url: '/users',
                data: {
                    username: this.newUsername,
                    password: this.newPassword
                },
            }).then( (response) => {
                console.log(response);
                console.log('status: ', response.data.status);
    			console.log('Created user: ', response.data);
                this.errorMsg = '';
                this.showSignup = ! this.showSignup;
            }, (error) => {
                console.log('error in createUser: ', error);
                this.errorMsg = error.data.message;
            });
        }
    };

    this.getViewUser = (userId) => { 
        $http({
            method: 'GET',
            url: '/users/' + userId
        }).then( (response) => { 
            this.viewUser = response.data;
        }, (err) => { 
            console.log(err)
        });
    };

    this.updateUser = (user) => {
        $http({
            method: 'PUT',
            url: '/users/' + user._id,
            data: user
        }).then( (response) => { 
            user = response.data
        }, (err) => { 
            console.log(err)
        });
    }

    this.logIn = () => {
        $http({
            method: 'POST',
            url: '/sessions',
            data: {
                username: this.username,
                password: this.password
            }
        }).then( (response) => {
            console.log(response);
            console.log('status: ', response.data.status);
			console.log('Logged in user: ', response.data);
			this.loggedInUser = response.data.loggedInUser;
            this.loggedIn = true;
			this.showLogin = false;
			this.errorMsg = '';
        }, (error) => {
            console.log(error);
            this.loginErr = true;
            this.errorMsg = error.data.message;
        })
    }

    this.logOut = () => {
        $http({
            method: 'DELETE',
            url: '/sessions'
        }).then( (response) => {
            console.log(response);
            this.loggedInUser = ''
            this.loggedIn = false;
            this.changeInclude('main-page');
            this.getAllThreads();
        }, (error) => {
            console.log(error.data.message);
        })
    }

    //A helper function to set the variables to show login/signup
        //We have many places where an action is forbidden unless logged in
        //This will help direct users to login/signup to continue
    this.promptLoginSignup = (showLogin, showSignup, message) => {
        this.showLogin = showLogin;
        this.showSignup = showSignup;
        this.loginErr = true;
        this.errorMsg = message;
    }

    this.showAvatarUpdate = (user) => { 
        this.avatarUpdateFields = true;
        this.updateAvatarUrl = user.img;
    }
    this.saveAvatarUpdate = (user) => { 
        user.img = this.updateAvatarUrl;
        this.updateUser(user);
        this.avatarUpdateFields = false;
        this.updateAvatarUrl = '';
    }
    this.cancelAvatarUpdate = () => { 
        this.avatarUpdateFields = false;
        this.updateAvatarUrl = '';
    }

    this.showPasswordUpdate = (user) => { 
        this.passwordUpdateFields = true;
        this.passwordUpdateStatus = {};
    }
    this.savePasswordUpdate = (user) => { 
        //Send request to server to check password against username
            //If thats successful
                // set user password to updatePassword then call user update
                    //Set the user in Angular to the returned user
                //close update fields
            //else not successful
                //error message 
                //close the update fields
                    
        if(user.newPassword !== user.newPasswordConf) {
            this.passwordUpdateStatus.message = 'New passwords entered do not match, try again.';
            user.oldPassword = '';
            user.newPassword = '';
            user.newPasswordConf = '';
        } else {
            $http({
                method: "POST",
                url: '/users/checkpass',
                data: user
            }).then( (response) => { 
                console.log(response);
                user = response.data;
                this.passwordUpdateFields = false;
                user.oldPassword = '';
                user.newPassword = '';
                user.newPasswordConf = '';
                this.passwordUpdateStatus.message = 'Password changed successfully!'
            }, (error) => { 
                console.log(error);
                this.passwordUpdateStatus.message = 'Old password is incorrect, please try again.';
                user.oldPassword = '';
                user.newPassword = '';
                user.newPasswordConf = '';
            })
        }     
    }
    this.cancelPasswordUpdate = (user) => { 
        this.passwordUpdateFields = false;
        user.oldPassword = '';
        user.newPassword = '';
        user.newPasswordConf = '';
    }

}]);
