let controller = (() => {
    let usersPage = 0;
    let module = {};
    module.onNewUsers = listener => {
        userListeners.push(listener);
    };
    module.nextUsersPage = imageId => {
        // need the last page
        api.getUsersPage(usersPage, (err, res) => {
            if (err) return notifyErrorListeners(err);
            if (usersPage < res.lastPage) {
                usersPage++;
                return notifyUserListeners();
            }
        });
    };
    module.prevUsersPage = () => {
        if (usersPage !== 0) {
            usersPage--;
            return notifyUserListeners();
        }
    };
    module.onError = listener => {
        errorListeners.push(listener);
    };

    // listeners
    let errorListeners = [];
    function notifyErrorListeners(err) {
        errorListeners.forEach(listener => listener(err));
    }

    let userListeners = [];
    function notifyUserListeners(curPage) {
        api.getUsersPage(usersPage, (err, res) => {
            if (err) return notifyErrorListeners(err);
            userListeners.forEach(listener => {
                listener(res.page, res.lastPage + 1, usersPage + 1);
            });
        });
    }
    if (api.getCurrentUser())
        window.setInterval(() => notifyUserListeners(), 2000);
    return module;
})();
