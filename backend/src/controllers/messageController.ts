// src/controllers/messageController.ts

import { Request, Response } from 'express';
import { Message, IMessage } from '../models/Message';
import mongoose from 'mongoose';
import { NestedMessage } from '../models/Message';

// 投稿またはコメントを作成
export const createMessage = async (req: Request, res: Response) => {
    try {
        const { content, user } = req.body;
        const { postId } = req.params;

        // 必須フィールドのバリデーション
        if (!content || !user) {
            return res.status(400).json({ error: 'Content and user are required' });
        }

        // parentIdが提供されている場合、その形式を検証
        if (postId && !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid parentId' });
        }

        // 新しいメッセージの作成
        const message = new Message({ content, parentId: postId || null, user });
        await message.save();

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create message' });
    }
};

// 全てのスレッド（parentIdがnullのメッセージ）を取得し、ネストされたリプライを含める
export const getThreads = async (req: Request, res: Response) => {
    try {
        const threads = await Message.aggregate([
            { $match: { parentId: null } },
            {
                $graphLookup: {
                    from: 'messages',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'replies',
                    depthField: 'depth', // ネストの深さを示すフィールド
                },
            },
            { $sort: { createdAt: -1 } }, // 作成日時の降順でソート
        ]);

        // ネストされたリプライを構築するためのヘルパー関数
        const buildTree = (message: any, allReplies: any[]): NestedMessage => {
            const children = allReplies.filter(
                (reply) => reply.parentId && reply.parentId.toString() === message._id.toString()
            );
            return {
                ...message,
                replies: children.map((child) => buildTree(child, allReplies)),
            };
        };

        // 全てのスレッドに対してネスト構造を構築
        const nestedThreads: NestedMessage[] = threads.map((thread) => buildTree(thread, thread.replies));

        res.status(200).json(nestedThreads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
};

// 指定されたスレッドに関連するコメント（リプライ）を取得し、ネストされたリプライを含める
export const getComments = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        // postIdの形式を検証
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }

        const comments = await Message.aggregate([
            { $match: { parentId: new mongoose.Types.ObjectId(postId) } }, // 指定されたスレッドの直下のリプライをマッチ
            {
                $graphLookup: {
                    from: 'messages',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'replies',
                    depthField: 'depth',
                },
            },
            { $sort: { createdAt: 1 } }, // 作成日時の昇順でソート
        ]);

        // ネストされたリプライを構築するためのヘルパー関数
        const buildTree = (message: any, allReplies: any[]): NestedMessage => {
            const children = allReplies.filter(
                (reply) => reply.parentId && reply.parentId.toString() === message._id.toString()
            );
            return {
                ...message,
                replies: children.map((child) => buildTree(child, allReplies)),
            };
        };

        // 全てのコメントに対してネスト構造を構築
        const nestedComments: NestedMessage[] = comments.map((comment) => buildTree(comment, comment.replies));

        res.status(200).json(nestedComments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};
