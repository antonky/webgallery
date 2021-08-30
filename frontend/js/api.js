let api = (() => {
    "use strict";
    let module = {};

    function sendFormData(method, url, data, callback) {
        let formData = new FormData();
        Object.keys(data).forEach(key => {
            let value = data[key];
            formData.append(key, value);
        });
        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            if (xhr.status !== 200)
                callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formData);
    }

    function send(method, url, data, callback) {
        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            if (xhr.status !== 200)
                callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        }
    }

    module.getCurrentUser = function() {
        var username = document.cookie.split("username=")[1];
        if (!username) return null;
        return username;
    };

    // add an image to the gallery
    module.addImage = (title, picture, cb) => {
        sendFormData(
            "POST",
            `/api/${module.getCurrentUser()}/images`,
            { title, picture },
            cb
        );
    };

    // delete an image from the gallery given its imageId
    module.deleteImage = (imageId, cb) => {
        send("DELETE", `/api/images/${imageId}`, null, cb);
    };

    // add a comment to an image
    module.addComment = (imageId, content, cb) => {
        send("POST", `/api/images/${imageId}/comments`, { content }, cb);
    };

    // delete a comment to an image
    module.deleteComment = (commentId, cb) => {
        send("DELETE", `/api/comments/${commentId}`, null, cb);
    };

    // get a page of images, pageNum is the page number cb gets the result
    module.getImagePage = (pageNum, gallery, cb) => {
        send("GET", `/api/${gallery}/images/?page=${pageNum}`, null, cb);
    };

    // get a page of comments, pageNum is the page number, imageId is the image
    // for which you want comments cb gets the result
    module.getCommentPage = (imageId, pageNum, cb) => {
        send(
            "GET",
            `/api/images/${imageId}/comments/?page=${pageNum}`,
            null,
            cb
        );
    };

    // get a page of users, pageNum is the page number
    module.getUsersPage = (pageNum, cb) => {
        send(
            "GET",
            `/api/users/?page=${pageNum}`,
            null,
            cb
        );
    };

    return module;
})();
