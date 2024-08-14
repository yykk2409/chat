const express = require("express");
const { readFileSync, existsSync, mkdirSync, writeFileSync } = require("fs");
const multer = require("multer");
const path = require("path");

const port = 8000;
const app = express();
app.use(express.json());

const commentsFile = './comments.json';
let comments = [];
const option = {
    key: readFileSync('./cert/privatekey.pem'),
    cert: readFileSync('./cert/cert.pem'),    
}
const server = require('https').createServer(option, app)
// アップロード先のディレクトリを設定
const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
}

// Multerの設定
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

// コメントを保存する関数
const saveComments = () => {
    writeFileSync(commentsFile, JSON.stringify(comments, null, 2), { encoding: "utf-8" });
};

// 初期化時にコメントファイルを読み込む
if (existsSync(commentsFile)) {
    comments = JSON.parse(readFileSync(commentsFile, { encoding: "utf-8" }));
}

app.get("/", (req, resp) => {
    resp.status(200).send(readFileSync("./index2.html", { encoding: "utf-8" }));
});

app.post("/addComment", upload.single('file'), (req, resp) => {
    const newComment = {
        user: req.body.user,
        comment: req.body.comment,
        file: req.file ? `/uploads/${req.file.filename}` : null
    };
    comments.push(newComment);
    saveComments();  // コメントを保存
    resp.status(200).send();
});

app.get("/loadComments", (req, resp) => {
    resp.status(200).send(JSON.stringify(comments));
});

// コメントの編集エンドポイント
app.post("/editComment", (req, resp) => {
    const { index, newComment } = req.body;
    if (index >= 0 && index < comments.length) {
        comments[index].comment = newComment;
        saveComments(); // 保存関数を呼び出す
        resp.status(200).send();
    } else {
        resp.status(400).send("Invalid index");
    }
});

// コメントの削除エンドポイント
app.post("/deleteComment", (req, resp) => {
    const { index } = req.body;
    if (index >= 0 && index < comments.length) {
        comments.splice(index, 1);
        saveComments(); // 保存関数を呼び出す
        resp.status(200).send();
    } else {
        resp.status(400).send("Invalid index");
    }
});


app.use('/uploads', express.static(uploadDir));

app.get("/resetComments", (req, resp) => {
    comments = [{ user: "Someone", comment: "ユーザー名とコメントを入力して送信" }];
    saveComments();  // リセット時も保存
    resp.status(200).send();
});

server.listen(port, () => console.log(`Listening on port ${port}!`))
