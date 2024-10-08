// src/models/Message.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface NestedMessage extends IMessage {
    replies: NestedMessage[];
}

export interface IMessage extends Document {
    user: string; // 投稿者の名前またはユーザーID
    content: string; // 投稿内容
    parentId?: mongoose.Types.ObjectId | null; // 親投稿のID（スレッドの場合はnull）
    createdAt: Date; // 作成日時
    updatedAt: Date; // 更新日時
}

const MessageSchema: Schema = new mongoose.Schema({
    user: { type: String, required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
}, { timestamps: true }); // createdAtとupdatedAtを自動管理

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
