import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import messageRoutes from './routes/messageRoutes';

// 環境変数の読み込み
require('dotenv').config();

// Expressアプリケーションのインスタンスを作成
const app = express();
const PORT = process.env.PORT || 5001;

// ミドルウェアの設定
app.use(cors());               // クロスオリジンリクエストを許可
app.use(bodyParser.json());     // リクエストボディをJSON形式で処理

// MongoDBに接続
const mongoUri = process.env.MONGO_URI;

if (mongoUri) {
    mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.error('MongoDB URI is undefined');
}

// ルーティング設定
app.use('/api', messageRoutes);

// サーバーを起動
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
