const express = require("express");
const { readFileSync, existsSync, mkdirSync } = require("fs");
const multer = require("multer");
const path = require("path");
const pool = require("./db");

const port = 8000;
const app = express();
app.use(express.json());

const option = {
    key: readFileSync('./cert/privatekey.pem'),
    cert: readFileSync('./cert/cert.pem'),    
}
const server = require('https').createServer(option, app)

const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const encodedName = decodeURI(file.originalname);
        cb(null, encodedName);
    }
});

const upload = multer({ storage: storage });

app.get("/", (req, resp) => {
    resp.status(200).send(readFileSync("./index2.html", { encoding: "utf-8" }));
});

app.get("/icon.png", (req, resp) => {
    resp.status(200).send(readFileSync("./icon.png"));
});

app.post("/addComment", upload.single('file'), async (req, resp) => {
    const newComment = {
        user: req.body.user,
        comment: req.body.comment,
        file: req.file ? `/uploads/${req.file.filename}` : null
    };

    try {
        await pool.query(
            "INSERT INTO comments (user, comment, file) VALUES ($1, $2, $3)",
            [newComment.user, newComment.comment, newComment.file]
        );
        resp.status(200).send();
    } catch (err) {
        console.error(err);
        resp.status(500).send("Error saving comment");
    }
});

app.get("/loadComments", async (req, resp) => {
    try {
        const result = await pool.query("SELECT * FROM comments");
        resp.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        resp.status(500).send("Error loading comments");
    }
});

app.post("/editComment", async (req, resp) => {
    const { id, newComment } = req.body;
    try {
        await pool.query(
            "UPDATE comments SET comment = $1 WHERE id = $2",
            [newComment, id]
        );
        resp.status(200).send();
    } catch (err) {
        console.error(err);
        resp.status(500).send("Error updating comment");
    }
});

app.post("/deleteComment", async (req, resp) => {
    const { id } = req.body;
    try {
        await pool.query("DELETE FROM comments WHERE id = $1", [id]);
        resp.status(200).send();
    } catch (err) {
        console.error(err);
        resp.status(500).send("Error deleting comment");
    }
});

app.use('/uploads', express.static(uploadDir));

app.get("/resetComments", async (req, resp) => {
    try {
        await pool.query("TRUNCATE comments RESTART IDENTITY");
        const defaultComment = {
            user: "Someone",
            comment: "ユーザー名とコメントを入力して送信"
        };
        await pool.query(
            "INSERT INTO comments (user, comment) VALUES ($1, $2)",
            [defaultComment.user, defaultComment.comment]
        );
        resp.status(200).send();
    } catch (err) {
        console.error(err);
        resp.status(500).send("Error resetting comments");
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
//server.listen(port, () => console.log(`Listening on port ${port}!`));
