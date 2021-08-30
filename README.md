# Web gallery API

## Authentication

1. Create an account for given user with given password

    - POST /api/signup
        - Body:
            - username
            - password
        - Response:
            - 500 for server error
            - 400 for missing fields
            - 409 if user exists
            - 200 for success and redirect to home page

    ```bash
    curl --location --request POST 'localhost:3000/api/signup' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "username": "nakamin",
        "password": "unicorns"
    }'
    ```

2. Sign in given user with given password

    - POST /api/signin
        - Body:
            - username
            - password
        - Response:
            - 500 for server error
            - 400 for missing fields
            - 401 on auth failure
            - 200 for success and redirect to home page
            - set cookie with username

    ```bash
    curl --location --request POST 'localhost:3000/api/signin' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "username": "nakamin",
        "password": "unicorns"
    }'
    ```

3. Sign out current user

    - GET /api/signout
        - Response:
            - 200 for success and redirect to home page

    ```bash
    curl --location --request GET 'localhost:3000/api/signout'
    ```

## Images

4. Add a new image to the gallery by uploading a file

    - POST /api/:user_id/images
        - content-type: multipart/form-encoded
        - Authentication: owner
        - Body:
            - title: image title
            - picture: the actual file
        - Response:
            - 500 for server error
            - 400 for missing fields
            - 404 if user isn't found
            - 401 if not authenticated or not owner of gallery
            - 200 for success and respond with image id

    ```bash
    curl --location --request POST 'localhost:3000/api/nakamin/images' \
    --header 'Content-Type: multipart/form-data; boundary=--------------------------824285857104807526886117' \
    --form 'title=yaboi' \
    --form 'picture=@/C:/Users/anton/Pictures/baller.jpg'
    ```

5. Retrieve the given image metadata

    - GET /api/images/:id
        - Authentication: authenticated
        - Response:
            - 500 for server error
            - 200 for success and respond with image metadata
                - `{title, author, _id, createdAt}`
            - 401 if not authenticated
            - 404 if id isn't found

    ```bash
    curl --location --request GET 'localhost:3000/api/images/K8pmF5xVe80gEmxn'
    ```

6. Retrieve the given image file

    - GET /api/images/:id/file
        - Authentication: authenticated
        - Response:
            - 500 for server error
            - 200 for success and respond with image data
                - Header content type set to mime type of file
            - 401 if not authenticated
            - 404 if id isn't found

    ```bash
    curl --location --request GET 'localhost:3000/api/images/kI5kXZ8IIGnvq7zT/file'
    ```

7. Retrieve 5 images with pagination

    - GET /api/:user_id/images/[?page=<int>]
        - Authentication: authenticated
        - Query params:
            - page: the page number
        - Response:
            - 500 for server error
            - 401 if not authenticated
            - 200 for success and respond with list of images
                - `[{title, author, _id, createdAt}]`

    ```bash
    curl --location --request GET 'localhost:3000/api/nakamin/images/?page=8'
    ```

8. Delete a given image

    - DELETE /api/images/:id
        - content-type: application/json
        - Authentication: owner
        - Response:
            - 500 for server error
            - 200 for success and respond with "success"
            - 401 if not authenticated or not owner of image
            - 404 if id isn't found

    ```bash
    curl --location --request DELETE 'localhost:3000/api/images/kI5kXZ8IIGnvq7zT'
    ```

## Comments

9.  Add a new comment to a specific image

    -   POST /api/images/:id/comments
        -   content-type: application/json
        -   Authentication: authenticated
        -   Body:
            -   content: comment text
        -   Response:
            -   500 for server error
            -   400 for missing fields
            -   401 if not authenticated
            -   200 for success and respond with comment id

    ```bash
    curl --location --request POST 'localhost:3000/api/images/K8pmF5xVe80gEmxn/comments' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "content": "comment oh dam son"
    }'
    ```

10. Retrieve 10 comments with pagination

    -   GET /api/images/:id/comments/[?page=<int>]
        -   Authentication: authenticated
        -   Query params:
            -   page: the page number
        -   Response:
            -   500 for server error
            -   200 for success and respond with list of comments
                -   `[{_id, imgId, author, content, createdAt}]`
            -   401 if not authenticated
            -   404 if id isn't found

    ```bash
    curl --location --request GET 'localhost:3000/api/images/kI5kXZ8IIGnvq7zT/comments/'
    ```

11. Delete a given comment

    -   DELETE /api/comments/:id_comment
        -   content-type: application/json
        -   Authentication: owner of comment or gallery
        -   Response:
            -   500 for server error
            -   200 for success and respond with "success"
            -   401 if not authenticated, not owner of comment or not owner of gallery
            -   404 if comment isn't found

    ```bash
    curl --location --request DELETE 'localhost:3000/api/comments/Ct0YIUorarJEFqs2'
    ```

12. Retrieve users

    -   GET /api/users/
        -   Authentication: authenticated
        -   Response:
            -   500 for server error
            -   200 for success and respond with list of usernames
                -   `[username]`
            -   401 if not authenticated

    ```bash
    curl --location --request GET 'localhost:3000/api/users'
    ```
