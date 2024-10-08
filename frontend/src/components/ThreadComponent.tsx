// src/components/ThreadComponent.tsx

import React, { useState } from 'react';
import { Thread } from '../types';
import '../App.css';

interface ThreadProps {
  thread: Thread;
  depth?: number;
  onAddReply: (threadId: string, content: string, user: string) => void;
}

const ThreadComponent: React.FC<ThreadProps> = ({ thread, depth = 0, onAddReply }) => {
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const [replyUser, setReplyUser] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim() === '' || replyUser.trim() === '') {
      setError('ユーザー名と返信内容を入力してください。');
      return;
    }
    try {
      await onAddReply(thread._id, replyContent, replyUser);
      setReplyContent('');
      setReplyUser('');
      setShowReplyForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to submit reply:', error);
      setError('返信の送信に失敗しました。');
    }
  };

  return (
    <div className="thread" style={{ marginLeft: depth * 20 }}>
      <div className="thread-content">
        <div className="thread-header">
          <span className="user">{thread.user}</span>
          <span className="timestamp">{new Date(thread.createdAt).toLocaleString()}</span>
        </div>
        <p>{thread.content}</p>
        <button onClick={() => setShowReplyForm(!showReplyForm)} className="reply-button">
          返信
        </button>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <div className="form-content">
            <div className="avatar">
              {/* アバター画像を使用する場合は <img> タグをここに追加 */}
            </div>
            <div className="form-fields">
              <input
                type="text"
                value={replyUser}
                placeholder="ユーザー名"
                onChange={(e) => setReplyUser(e.target.value)}
                required
              />
              <textarea
                value={replyContent}
                placeholder="返信を入力..."
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
              <div>
                <button type="submit" className="submit-button">
                  送信
                </button>
                <button type="button" onClick={() => setShowReplyForm(false)} className="cancel-button">
                  キャンセル
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        </form>
      )}

      <div className="replies">
        {Array.isArray(thread.replies) && thread.replies.length > 0 && (
          thread.replies.map((reply) => (
            <ThreadComponent key={reply._id} thread={reply} depth={depth + 1} onAddReply={onAddReply} />
          ))
        )}
      </div>
    </div>
  );
};

export default ThreadComponent;
