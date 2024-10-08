import axios from 'axios';
import { Reply, Thread } from './types';

const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 全てのスレッド（投稿）を取得する関数
export const fetchThreads = async (): Promise<Thread[]> => {
  const response = await apiClient.get<Thread[]>('/posts');
  return response.data;
};

// 新しい投稿を作成する関数
export const post = async (content: string, user: string): Promise<Thread[]> => {
  const response = await apiClient.post<Thread[]>('/posts', { content, user });
  return response.data;
};

// 特定のスレッドにコメントを追加する関数
export const postReply = async (postId: string, content: string, user: string): Promise<Reply> => {
  const response = await apiClient.post<Reply>(`/posts/${postId}/comments`, { content, user });
  return response.data;
};

export const createThread = async (content: string, user: string): Promise<Thread> => {
  const response = await apiClient.post<Thread>('/posts', { content, user });
  return { ...response.data, replies: [] };
};
