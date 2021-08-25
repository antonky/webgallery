(() => {
    "use strict";
    controller.onError(err => console.log(err));

    controller.onError(err => {
        let error_box = document.querySelector("#error_box");
        error_box.innerHTML = err;
        error_box.style.visibility = "visible";
    });

    controller.onNewImage((image, pageNum, totalPages) => {
        let root = document.getElementById("image_root");
        if (image) {
            document.getElementById("comment_form").style.display = "block";
            document.getElementById("comment_form").onsubmit = e => {
                e.preventDefault();
                let content = document.getElementById("comment_text").value;
                controller.addComment(image._id, content);
                e.target.reset();
            };
            root.innerHTML = `<div class="image_card">
        <div class="image_info">
          <div class="avatar_icon"></div>
          <div class="text_info">
            <h2 id="title">${image.title}</h2>
            <h3 id="author">${image.author}</h3>
          </div>
        </div>
        <img src="/api/images/${image._id}/file" alt="${image.title}" id="main_image" />
        <div class="image_controls">
          <div class="paginate_image">
            <button class="btn prev_button" id="prev_image">
              <i class="fas fa-arrow-left"></i>
              <p>Prev</p>
            </button>
            <p class="page_info" id="image_page">${pageNum}/${totalPages}</p>
            <button class="btn next_button" id="next_image">
              <p>Next</p>
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          <button class="btn delete_image" id="delete_image">
            Delete <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>`;
            root.querySelector("#prev_image").addEventListener("click", e => {
                controller.prevPage();
            });
            root.querySelector("#next_image").addEventListener("click", e => {
                controller.nextPage();
            });
            root.querySelector("#delete_image").addEventListener("click", e => {
                controller.deleteImage(image._id);
            });
        } else {
            root.innerHTML = '<h1 id="empty_message">Add an image first</h1>';
            document.getElementById("comment_form").style.display = "none";
        }
    });

    controller.onNewComments((comments, pageNum, totalPages, imageId) => {
        let root = document.getElementById("comment_root");
        root.innerHTML = "";
        if (comments.length !== 0) {
            comments.forEach(comment => {
                let date = new Date(comment.createdAt);
                let container = document.createElement("div");
                container.className = "comment";
                container.innerHTML = `<div class="comment_header">
        <div class="comment_info">
          <p class="comment_author">${comment.author}</p>
          <p class="comment_separate">&middot;</p>
          <p class="comment_date">${date.getFullYear()}-${date.getMonth() +
                    1}-${date.getDate()}</p>
        </div>
        <i class="far fa-trash-alt delete_comment"></i>
      </div>
      <div class="comment_text">
        ${comment.content}
      </div>`;
                container
                    .querySelector(".delete_comment")
                    .addEventListener("click", e => {
                        controller.deleteComment(comment._id, imageId);
                    });
                root.appendChild(container);
            });
            let footer = document.createElement("div");
            footer.className = "comment_footer";
            footer.innerHTML = `<div class="paginate_comments">
      <button class="btn prev_button" id="prev_comment">
        <i class="fas fa-arrow-left"></i>
        <p>Prev</p>
      </button>
      <p class="page_info" id="comment_page">${pageNum}/${totalPages}</p>
      <button class="btn next_button" id="next_comment">
        <p>Next</p>
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>`;
            footer
                .querySelector("#prev_comment")
                .addEventListener("click", e => {
                    controller.prevCommentPage();
                });
            footer
                .querySelector("#next_comment")
                .addEventListener("click", e => {
                    controller.nextCommentPage(imageId);
                });
            root.appendChild(footer);
        } else {
            root.innerHTML = '<h1 id="empty_message">No comments yet</h1>';
        }
    });
    window.addEventListener("load", () => {
        //   modal setup
        document.getElementById("submit_post").addEventListener("click", e => {
            document.getElementById("submit_modal").style.display = "flex";
        });

        document.getElementById("close_modal").addEventListener("click", e => {
            document.getElementById("submit_modal").style.display = "none";
        });
        document
            .getElementById("image_add_form")
            .addEventListener("submit", e => {
                e.preventDefault();
                let title = document.getElementById("title_input").value;
                let file = document.getElementById("image_choose_file")
                    .files[0];
                controller.addImage(title, file);
                document.getElementById("submit_modal").style.display = "none";
                e.target.reset();
            });
    });
})();
