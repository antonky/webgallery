const bcrypt = require("bcrypt");
const body_parser = require("body-parser");
const cookie = require("cookie");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const upload = multer({ dest: path.join(__dirname, "uploads") });

const IMAGE_PAGE_SIZE = 1;
const COMMENT_PAGE_SIZE = 10;
const USERS_PAGE_SIZE = 10;

const app = express();

app.use(
    session({
        secret: "please change this secret",
        resave: false,
        saveUninitialized: true
    })
);

app.use((req, res, next) => {
    req.username = "username" in req.session ? req.session.username : null;
    let username = req.username ? req.username : "";
    res.setHeader(
        "Set-Cookie",
        cookie.serialize("username", username, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
        })
    );
    next();
});

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    console.log(req.method, req.url, req.body);
    next();
});

let isAuthenticated = (req, res, next) => {
    if (!req.username) return res.status(401).end("access denied");
    next();
};

let Datastore = require("nedb"),
    images = new Datastore({
        filename: "db/images.db",
        autoload: true,
        timestampData: true
    }),
    comments = new Datastore({
        filename: "db/comments.db",
        autoload: true,
        timestampData: true
    }),
    users = new Datastore({
        filename: "db/users.db",
        autoload: true,
        timestampData: true
    });

/* Authentication */

// 1. Create an account for given user with given password
app.post("/api/signup/", (req, res) => {
    // extract data from HTTP request
    if (!("username" in req.body))
        return res.status(400).end("username is missing");
    if (!("password" in req.body))
        return res.status(400).end("password is missing");
    let username = req.body.username;
    let password = req.body.password;
    // check if user already exists in the database
    users.findOne({ _id: username }, (err, user) => {
        if (err) return res.status(500).end(err);
        if (user)
            return res
                .status(409)
                .end("username " + username + " already exists");
        // generate a new salt and hash
        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).end(err);
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) return res.status(500).end(err);
                // insert new user into the database
                users.insert({ _id: username, hash: hash }, err => {
                    if (err) return res.status(500).end(err);
                    return res.redirect("/");
                });
            });
        });
    });
});

// 2.  Sign in given user with given password
app.post("/api/signin/", (req, res) => {
    // extract data from HTTP request
    if (!("username" in req.body))
        return res.status(400).end("username is missing");
    if (!("password" in req.body))
        return res.status(400).end("password is missing");
    let username = req.body.username;
    let password = req.body.password;
    // retrieve user from the database
    users.findOne({ _id: username }, (err, user) => {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        bcrypt.compare(password, user.hash, (err, valid) => {
            if (err) return res.status(500).end(err);
            if (!valid) return res.status(401).end("access denied");
            // start a session
            req.session.username = user._id;
            res.setHeader(
                "Set-Cookie",
                cookie.serialize("username", user._id, {
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
                })
            );
            return res.redirect("/");
        });
    });
});

// 3.  Sign out current user
app.get("/api/signout/", (req, res) => {
    req.session.destroy();
    res.setHeader(
        "Set-Cookie",
        cookie.serialize("username", "", {
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
        })
    );
    return res.redirect("/");
});

/* Images */

// 4. Add a new image to the gallery by uploading a file
app.post(
    "/api/:user_id/images",
    isAuthenticated,
    upload.single("picture"),
    (req, res) => {
        let title = req.body.title;
        let author = req.params.user_id;
        if (!title) return res.status(400).end();
        if (req.username !== author)
            return res.status(401).end("access denied");
        users.findOne({ _id: author }, (err, user) => {
            if (err) return res.status(500).end(err);
            if (!user)
                return res.status(404).end(`User ${author} does not exist`);
            const imageDoc = {
                title,
                author,
                file: req.file,
                createdAt: new Date().toISOString()
            };
            images.insert(imageDoc, (err, newImage) => {
                if (err) return res.status(500).end(err);
                return res.json(newImage._id);
            });
        });
    }
);

// 5.  Retrieve the given image metadata
app.get("/api/images/:id", isAuthenticated, (req, res) => {
    images
        .findOne({ _id: req.params.id })
        .projection({ file: 0, updatedAt: 0 })
        .exec((err, img) => {
            if (err) return res.status(500).end(err);
            if (!img)
                return res
                    .status(404)
                    .end(`Image with id ${req.params.id} does not exist`);
            res.json(img);
        });
});

// 6.  Retrieve the given image file
app.get("/api/images/:id/file", isAuthenticated, (req, res) => {
    images.findOne({ _id: req.params.id }, (err, img) => {
        if (err) return res.status(500).end(err);
        if (!img)
            return res
                .status(404)
                .end(`Image with id ${req.params.id} does not exist`);
        res.setHeader("Content-Type", img.file.mimetype);
        res.sendFile(img.file.path);
    });
});

// 7.  Retrieve 5 images from gallery with pagination
app.get("/api/:user_id/images", isAuthenticated, (req, res) => {
    let page = req.query.page;
    let user = req.params.user_id;
    if (!page) page = 0;
    images.count({ author: user }, (err, numImg) => {
        if (err) return res.status(500).end(err);
        if (numImg === 0) return res.json({ page: [], lastPage: 0 });
        const lastPage =
            Math.floor((numImg + IMAGE_PAGE_SIZE - 1) / IMAGE_PAGE_SIZE) - 1;
        images
            .find({ author: user }, { file: 0, updatedAt: 0 })
            .sort({ createdAt: -1 })
            .skip(page * IMAGE_PAGE_SIZE)
            .limit(IMAGE_PAGE_SIZE)
            .exec((err, imgPage) => {
                if (err) return res.status(500).end(err);
                let result = { page: imgPage, lastPage };
                return res.json(result);
            });
    });
});

// 8.  Delete a given image
app.delete("/api/images/:id", isAuthenticated, (req, res) => {
    // find the image we want to remove
    images.findOne({ _id: req.params.id }, (err, img) => {
        if (err) return res.status(500).end(err);
        if (!img)
            return res
                .status(404)
                .end(`Image with id ${req.params.id} does not exist`);
        // can only delete if you are owner
        if (img.author !== req.username)
            return res.status(401).end("access denied");
        // once found remove it
        images.remove({ _id: req.params.id }, (err, _) => {
            if (err) return res.status(500).end(err);
            // delete the files
            fs.unlink(img.file.path, err => {
                if (err) return res.status(500).end(err);
                // delete all the comments too
                comments.remove(
                    { imageId: req.params.id },
                    { multi: true },
                    (err, _) => {
                        if (err) return res.status(500).end(err);
                        return res.json("success");
                    }
                );
            });
        });
    });
});

/* Comments */

// 9.  Add a new comment to a specific image
app.post("/api/images/:id/comments", isAuthenticated, (req, res) => {
    let content = req.body.content;
    if (!content) return res.status(400).end();
    images.findOne({ _id: req.params.id }, (err, img) => {
        if (err) return res.status(500).end(err);
        if (!img)
            return res
                .status(404)
                .end(`Image with id ${req.params.id} does not exist`);
        const commentDoc = {
            imageId: req.params.id,
            author: req.username,
            content,
            createdAt: new Date().toISOString()
        };
        comments.insert(commentDoc, (err, newComment) => {
            if (err) return res.status(500).end(err);
            return res.json(newComment._id);
        });
    });
});

// 10. Retrieve 10 comments with keyset pagination
app.get("/api/images/:id/comments", isAuthenticated, (req, res) => {
    let page = req.query.page;
    if (!page) page = 0;
    comments.count({ imageId: req.params.id }, (err, numComm) => {
        if (err) return res.status(500).end(err);
        if (numComm === 0) return res.json({ page: [], lastPage: 0 });
        const lastPage =
            Math.floor((numComm + COMMENT_PAGE_SIZE - 1) / COMMENT_PAGE_SIZE) -
            1;
        comments
            .find({ imageId: req.params.id }, { updatedAt: 0 })
            .sort({ createdAt: -1 })
            .skip(page * COMMENT_PAGE_SIZE)
            .limit(COMMENT_PAGE_SIZE)
            .exec((err, comments) => {
                if (err) return res.status(500).end(err);
                let result = { page: comments, lastPage };
                return res.json(result);
            });
    });
});

// 11. Delete a given comment
app.delete("/api/comments/:id/", isAuthenticated, (req, res) => {
    comments.findOne({ _id: req.params.id }, (err, comment) => {
        if (err) return res.status(500).end(err);
        if (!comment)
            return res
                .status(404)
                .end(`Comment with id ${req.params.id} does not exist`);
        // check if owner of comment
        if (comment.author !== req.username) {
            // check if owner of gallery
            images.findOne({ _id: comment.imageId }, (err, image) => {
                if (err) return res.status(500).end(err);
                if (image.author !== req.username)
                    return res.status(401).end("access denied");
                comments.remove({ _id: req.params.id }, (err, _) => {
                    if (err) return res.status(500).end(err);
                    return res.json("success");
                });
            });
        } else {
            comments.remove({ _id: req.params.id }, (err, _) => {
                if (err) return res.status(500).end(err);
                return res.json("success");
            });
        }
    });
});

/* Galleries/users */

// 12. Retrieve 10 users with pagination
app.get("/api/users", isAuthenticated, (req, res) => {
    let page = req.query.page;
    if (!page) page = 0;
    users.count({}, (err, numUsers) => {
        if (err) return res.status(500).end(err);
        if (numUsers === 0) return res.json({ page: [], lastPage: 0 });
        const lastPage =
            Math.floor((numUsers + USERS_PAGE_SIZE - 1) / USERS_PAGE_SIZE) - 1;
        users
            .find({})
            .sort({ createdAt: -1 })
            .skip(page * USERS_PAGE_SIZE)
            .limit(USERS_PAGE_SIZE)
            .exec((err, users) => {
                if (err) return res.status(500).end(err);
                let name_list = users.map(user => user._id);
                let result = { page: name_list, lastPage };
                return res.json(result);
            });
    });
});

app.use(express.static("frontend"));

const http = require("http");
const PORT = process.env.PORT || 8080;

http.createServer(app).listen(PORT, err => {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
