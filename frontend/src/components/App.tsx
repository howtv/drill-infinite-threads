import React, { useState, useEffect } from 'react';
import { fetchThreads, postReply, createThread } from '../api';
import { Thread } from '../types';
import ThreadComponent from './ThreadComponent';
import '../index.css';
import '../App.css';

const App: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostUser, setNewPostUser] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllThreads();
  }, []);

  // 全てのスレッドを取得する関数
  const fetchAllThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      setError('スレッドの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 新しいスレッドを作成する関数
  const handleCreateThread = async () => {
    if (newPostContent.trim() === '' || newPostUser.trim() === '') {
      setError('ユーザー名と内容を入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newThread = await createThread(newPostContent, newPostUser);
      setThreads((prevThreads) => [newThread, ...prevThreads]);
      setNewPostContent('');
      setNewPostUser('');
    } catch (error) {
      console.error('Failed to create thread:', error);
      setError('スレッドの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 新しい返信を追加する関数
  const handleAddReply = async (threadId: string, content: string, user: string) => {
    if (content.trim() === '' || user.trim() === '') {
      setError('ユーザー名と返信内容を入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newReply = await postReply(threadId, content, user);
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread._id === threadId
            ? { ...thread, replies: [...thread.replies, newReply] }
            : thread
        )
      );
    } catch (error) {
      console.error('Failed to add reply:', error);
      setError('返信の追加に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>スレッド一覧</h1>

      {/* 新しいスレッドのコンテンツ入力フォーム */}
      <div className="new-thread-form">
        <input
          type="text"
          value={newPostUser}
          placeholder="ユーザー名"
          onChange={(e) => setNewPostUser(e.target.value)}
        />
        <textarea
          value={newPostContent}
          placeholder="新しいスレッドの内容"
          onChange={(e) => setNewPostContent(e.target.value)}
        />
        <button onClick={handleCreateThread} disabled={loading}>
          {loading ? '作成中...' : '新しいスレッドを作成'}
        </button>
      </div>

      {/* エラーメッセージの表示 */}
      {error && <div className="error-message">{error}</div>}

      {/* ローディング状態の表示 */}
      {loading && <div className="loading">読み込み中...</div>}

      {/* ThreadComponent を使用して、各スレッドを表示 */}
      <div className="threads-list">
        {threads.map((thread) => (
          <ThreadComponent key={thread._id} thread={thread} onAddReply={handleAddReply} />
        ))}
      </div>
    </div>
  );
};

export default App;
