const app = angular.module('forumApp', []);

app.filter('threadFilters', function() {
    console.log('In thread filter');
    return function(input, filterSelector, user) {
        let out = [];
        console.log(input);
        angular.forEach(input, function(e) {
            // "my posts" filter
            if(filterSelector === 'my posts') {
                if(e.userRef === user._id) {
                    out.push(e);
                }
            }
            // 'my comments' filter
            else if (filterSelector === 'my comments') {
                if(e.comments) {
                    console.log('thread:', e);
                    let userCommented = e.comments.some( (comment) => {
                        console.log(comment.userRef, user._id );
                        return comment.userRef === user._id
                    })
                    if(userCommented) { out.push(e)}
                }
            }
            // 'liked posts' filter
            else if(filterSelector === 'liked posts') {
                if(e.likeUsers) {
                    if (user._id in e['likeUsers']) {
                        out.push(e);
                    }
                }
            }
            else {
                out.push(e)
            }
        });
        return out;
    }
});

app.controller('ThreadController', ['$http','$scope','$q', function($http, $scope,$q){
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
    $scope.currFilterSelector = '';
    this.currOrder = '-createdAt';
    $scope.sortLeastLikes = function(thread) {
        return parseInt(thread.likes)
    };
    $scope.sortMostLikes = function(thread) {
        return - parseInt(thread.likes)
    };
    this.changeFilter = (filter) => {
        if(filter !== 'search') {
            this.searchText = ''
        }
        this.currFilterSelector = filter;
        console.log('Filter sel: ',this.currFilterSelector);
    }

    ///////////////////////////
    //      View Switching
    //////////////////////////
    this.viewThread = '';
    this.viewUser = '';
    this.changeInclude = (path) => {
        if(path !== 'user-profile') {
            this.viewUser = {};
        }
        this.includePath = 'partials/' + path + '.html';
        console.log(this.viewUser, this.viewThread);
    }

    //Load data needed to show user profile
    this.showUserProfile = (userId) => {
        this.getViewUser(userId);
        // this.changeInclude('user-profile');
        console.log('page switch view user: ',this.viewUser);
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
    this.removeThreadLike = (thread) => {
        delete thread.likeUsers[this.loggedInUser._id];
        console.log(thread.likeUsers);
        this.updateThread(thread);
    }
    //Check if user has liked thread
    this.checkLikes = (thread) => {
        if(this.loggedInUser && thread.likeUsers) {
            //Return true if the user has liked a thread
            if(this.loggedInUser._id in thread.likeUsers) {
                return true;
            }
        }

        return false;
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

    this.getUserThreads = (user) => {
        $http({
            method: 'GET',
            url: '/threads/user/' + user._id
        }).then( (response) => {
            this.viewUser.userThreads = response.data;
        }, (error) => {
            console.log(error);
        })
    }

    this.getViewThreadFromComment = (comment) => {
        $http({
            method: 'GET',
            url: '/threads/' + comment.threadRef
        }).then( (response) => {
            this.viewThread = response.data;
            this.changeInclude('thread');
        }, (error) => {
            console.log(error);
        })
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

    //Get all comments for a given user
    this.getUserComments = (user) => {
        $http({
            method: 'GET',
            url: '/comments/user/' + user._id
        }).then( (response) => {
            this.viewUser.userComments = response.data;
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
                this.showLogin = true;
            }, (error) => {
                console.log('error in createUser: ', error);
                this.errorMsg = error.data.message;
            });
        }
    };

    this.getViewUser = (userId) => {
        this.viewUser = {};
        $http({
            method: 'GET',
            url: '/users/' + userId
        }).then( (response) => {
            this.viewUser = response.data;

            let promiseArr = []
            promiseArr[0] = $http({
                method: 'GET',
                url: '/threads/user/' + userId
            });
            promiseArr[1] = $http({
                method: 'GET',
                url: '/comments/user/' + userId
            });


            $q.all(promiseArr).then( (response) => {
                console.log('Q all~!');
                console.log(response);
                this.viewUser.userThreads = response[0].data;
                this.viewUser.userComments = response[1].data;
                this.changeInclude('user-profile');
            })


            console.log('Get view user: ',response.data);
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
        //Check if the new passwords are the same - show error if not
        if(user.newPassword !== user.newPasswordConf) {
            this.passwordUpdateStatus.message = 'New passwords entered do not match, try again.';
            user.oldPassword = '';
            user.newPassword = '';
            user.newPasswordConf = '';
        } 
        //Sent request to server to check old password is valid
        else {
            $http({
                method: "POST",
                url: '/users/checkpass',
                data: user
            }).then( (response) => { 
                //If old password is accepted, set new password in DB
                    //Then reset all the password change fields and chose success message
                console.log(response);
                user = response.data;
                this.passwordUpdateFields = false;
                user.oldPassword = '';
                user.newPassword = '';
                user.newPasswordConf = '';
                this.passwordUpdateStatus.message = 'Password changed successfully!'
            }, (error) => { 
                //If the old password is wrong, set an error message and reset the fields
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
