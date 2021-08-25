let controller = (() => {
    let currentPage = 0;
    let commentsPage = 0;
    let gallery = window.location.hash.substring(1);
    let module = {};
    module.nextPage = () => {
        // need the last page
        api.getImagePage(currentPage, gallery, (err, res) => {
            if (err) return notifyErrorListeners(err);
            if (currentPage < res.lastPage) {
                currentPage++;
                commentsPage = 0;
                return notifyImageListeners();
            }
        });
    };
    module.prevPage = () => {
        if (currentPage !== 0) {
            currentPage--;
            commentsPage = 0;
            return notifyImageListeners();
        }
    };
    module.addImage = (title, picture) => {
        api.addImage(title, picture, (err, res) => {
            if (err) return notifyErrorListeners(err);
            commentsPage = 0;
            return notifyImageListeners();
        });
    };
    module.onNewImage = listener => {
        imageListeners.push(listener);
        api.getImagePage(currentPage, gallery, (err, res) => {
            if (err) return notifyErrorListeners(err);
            listener(res.page[0], currentPage + 1, res.lastPage + 1);
        });
    };
    module.deleteImage = imageId => {
        api.deleteImage(imageId, (err, res) => {
            if (err) return notifyErrorListeners(err);
            // might need to decrease page number
            // need last page
            api.getImagePage(currentPage, gallery, (err, res) => {
                if (err) return notifyErrorListeners(err);
                if (currentPage > res.lastPage) {
                    currentPage--;
                }
                return notifyImageListeners();
            });
        });
    };
    module.addComment = (imageId, content) => {
        api.addComment(imageId, content, (err, res) => {
            if (err) return notifyErrorListeners(err);
            notifyImageListeners();
        });
    };
    module.onNewComments = listener => {
        commentListeners.push(listener);
    };
    module.nextCommentPage = imageId => {
        // need the last page
        api.getCommentPage(imageId, commentsPage, (err, res) => {
            if (err) return notifyErrorListeners(err);
            if (commentsPage < res.lastPage) {
                commentsPage++;
                return notifyImageListeners();
            }
        });
    };
    module.prevCommentPage = () => {
        if (commentsPage !== 0) {
            commentsPage--;
            return notifyImageListeners();
        }
    };
    module.deleteComment = (commentId, imageId) => {
        api.deleteComment(commentId, (err, res) => {
            if (err) return notifyErrorListeners(err);
            // might need to decrease comment page number
            // need last page
            // need the last page
            api.getCommentPage(imageId, commentsPage, (err, res) => {
                if (err) return notifyErrorListeners(err);
                if (commentsPage > res.lastPage) {
                    commentsPage--;
                }
                return notifyImageListeners();
            });
        });
    };
    module.onError = listener => {
        errorListeners.push(listener);
    };

    // listeners
    let imageListeners = [];
    function notifyImageListeners() {
        api.getImagePage(currentPage, gallery, (err, res) => {
            if (err) return notifyErrorListeners(err);
            imageListeners.forEach(listener => {
                listener(res.page[0], currentPage + 1, res.lastPage + 1);
                notifyCommentListeners(res.page[0]);
            });
        });
    }

    let errorListeners = [];
    function notifyErrorListeners(err) {
        errorListeners.forEach(listener => listener(err));
    }

    let commentListeners = [];
    function notifyCommentListeners(curPage) {
        if (!curPage) {
            let root = document.getElementById("comment_root");
            root.innerHTML = "";
            return;
        }
        api.getCommentPage(curPage._id, commentsPage, (err, res) => {
            if (err) return notifyErrorListeners(err);
            commentListeners.forEach(listener => {
                listener(
                    res.page,
                    commentsPage + 1,
                    res.lastPage + 1,
                    curPage._id
                );
            });
        });
    }

    window.setInterval(() => notifyImageListeners(), 2000);
    return module;
})();
