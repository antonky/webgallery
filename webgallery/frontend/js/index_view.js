(() => {
    "use strict";

    window.addEventListener("load", () => {
        controller.onError(err => {
            let error_box = document.querySelector("#error_box");
            error_box.innerHTML = err;
            error_box.style.visibility = "visible";
        });

        let user = api.getCurrentUser();
        if (user) {
            document.querySelector("#signup").classList.add("hidden");
            let userslist = document.querySelector("#userlist");
            userslist.classList.remove("hidden");
        } else {
            document.querySelector("#signin").classList.remove("hidden");
        }
        controller.onNewUsers((users, totalPages, pageNum) => {
            if (api.getCurrentUser()) {
                let root = document.getElementById("userlist");
                root.innerHTML = "";
                users.forEach(user => {
                    let item = document.createElement("li");
                    item.innerHTML = `<a href="/gallery.html#${user}">${user}</a>`;
                    root.appendChild(item);
                });
                let footer = document.createElement("div");
                footer.className = "users_footer";
                footer.innerHTML = `<div class="paginate_users">
          <button class="btn prev_button" id="prev_user">
            <i class="fas fa-arrow-left"></i>
            <p>Prev</p>
          </button>
      <p class="page_info" id="user_page">${pageNum}/${totalPages}</p>
          <button class="btn next_button" id="next_user">
            <p>Next</p>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>`;
                footer
                    .querySelector("#prev_user")
                    .addEventListener("click", e => {
                        controller.prevUsersPage();
                    });
                footer
                    .querySelector("#next_user")
                    .addEventListener("click", e => {
                        controller.nextUsersPage();
                    });
                root.appendChild(footer);
            }
        });
    });
})();
