// src/routes/messageRoutes.ts

import express from 'express';
import { createMessage, getThreads, getComments } from '../controllers/messageController';

const router = express.Router();

// 投稿の作成
router.post('/posts', createMessage);

// コメントの作成
router.post('/posts/:postId/comments', createMessage);

// スレッドの取得（タイムライン）
router.get('/posts', getThreads);

// 特定のスレッドに対するコメントの取得
router.get('/posts/:postId/comments', getComments);

export default router;
