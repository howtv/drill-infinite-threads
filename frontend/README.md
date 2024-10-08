# メッセージ投稿アプリのフロントエンド解説

このプロジェクトでは、ReactとTypeScriptを使用してメッセージ投稿アプリのフロントエンドを実装しています。投稿（スレッド）を表示し、各スレッドに対して再帰的にネストされたコメントを表示する機能を備えています。また、新しいコメントを追加するフォームも提供されています。

## プロジェクト構成

- `App.tsx`: メインコンポーネントで、スレッドの表示と新しいスレッドの作成を行います。
- `ThreadComponent.tsx`: 再帰的にネストされたコメントとスレッドを表示するコンポーネントです。
- `api.ts`: APIとやり取りを行う関数が定義されています。`fetchThreads`、`createThread`、`postReply` などのメソッドでデータの取得や投稿を行います。
- `types.ts`: データモデルを定義しています。投稿（スレッド）やコメントの型を定義し、データの一貫性を保証します。

## 主な機能

### 1. 投稿（スレッド）の表示

#### `App.tsx` の概要

`App.tsx` はアプリのメインコンポーネントで、全てのスレッド（投稿）を表示し、新しい投稿を追加するフォームも含んでいます。スレッドの取得は `fetchThreads` 関数を使用し、`useState` と `useEffect` を使用して非同期にデータを管理します。

```typescript
useEffect(() => {
  fetchAllThreads();
}, []);

const fetchAllThreads = async () => {
  setLoading(true);
  try {
    const data = await fetchThreads();
    setThreads(data);
  } catch (error) {
    setError('スレッドの取得に失敗しました。');
  } finally {
    setLoading(false);
  }
};
```

**ポイント**:
- **非同期処理**: `fetchThreads` 関数は非同期でスレッドデータを取得し、成功時には `setThreads` を使って状態を更新します。
- **エラーハンドリング**: APIの失敗時には `setError` を使ってエラーメッセージを表示します。

#### 新しいスレッドの作成

新しいスレッドを追加するフォームがあり、`createThread` 関数を使用して新しいスレッドをAPIに送信します。

```typescript
const handleCreateThread = async () => {
  if (newPostContent.trim() === '' || newPostUser.trim() === '') {
    setError('ユーザー名と内容を入力してください。');
    return;
  }
  setLoading(true);
  try {
    const newThread = await createThread(newPostContent, newPostUser);
    setThreads((prevThreads) => [newThread, ...prevThreads]);
    setNewPostContent('');
    setNewPostUser('');
  } catch (error) {
    setError('スレッドの作成に失敗しました。');
  } finally {
    setLoading(false);
  }
};
```

**ポイント**:
- **バリデーション**: ユーザー名と内容が空でないかを確認します。
- **状態の更新**: 成功したら、新しいスレッドを既存のスレッド一覧の先頭に追加します。

---

### 2. 再帰的なコメントの表示

#### `ThreadComponent.tsx` の概要

`ThreadComponent.tsx` はスレッドやコメントを表示するコンポーネントです。ここでは再帰的にネストされたコメントを表示するため、親コメントが持つ `replies` フィールドを使い、再帰的に自身のコンポーネントを呼び出しています。

```typescript
const ThreadComponent: React.FC<ThreadProps> = ({ thread, depth = 0, onAddReply }) => {
  return (
    <div className="thread" style={{ marginLeft: depth * 20 }}>
      {/* スレッド内容の表示 */}
      <div className="thread-content">
        <span className="user">{thread.user}</span>
        <p>{thread.content}</p>
        {/* 返信ボタン */}
        <button onClick={() => setShowReplyForm(!showReplyForm)}>返信</button>
      </div>

      {/* ネストされたリプライを再帰的に表示 */}
      <div className="replies">
        {thread.replies.map((reply) => (
          <ThreadComponent key={reply._id} thread={reply} depth={depth + 1} onAddReply={onAddReply} />
        ))}
      </div>
    </div>
  );
};
```

**ポイント**:
- **再帰的な表示**: `ThreadComponent` は自分自身を再帰的に呼び出して、ネストされたリプライを表示します。
- **深さによるインデント**: `depth` プロパティを使って、ネストの深さに応じてインデントを調整します。

---

### 3. 新しいコメントの追加

#### 返信フォームの実装

`ThreadComponent` では、ユーザーが特定のスレッドやコメントに対して返信できるフォームを表示します。このフォームは動的に表示され、送信時に `onAddReply` 関数を呼び出してAPIに送信します。

```typescript
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
  } catch (error) {
    setError('返信の送信に失敗しました。');
  }
};
```

**ポイント**:
- **非同期リクエスト**: `onAddReply` を使用して、APIに新しいコメントを送信します。成功時にはフォームの内容をリセットし、返信フォームを閉じます。

---

### 4. APIとのやり取り

#### APIクライアント (`api.ts`)

APIとのやり取りは `axios` を使用して行います。全てのスレッドの取得、新しいスレッドの作成、特定のスレッドへのコメントの投稿などが実装されています。

- **全てのスレッドの取得**:

```typescript
export const fetchThreads = async (): Promise<Thread[]> => {
  const response = await apiClient.get<Thread[]>('/posts');
  return response.data;
};
```

- **新しいスレッドの作成**:

```typescript
export const createThread = async (content: string, user: string): Promise<Thread> => {
  const response = await apiClient.post<Thread>('/posts', { content, user });
  return { ...response.data, replies: [] };
};
```

- **特定のスレッドにコメントを追加**:

```typescript
export const postReply = async (postId: string, content: string, user: string): Promise<Reply> => {
  const response = await apiClient.post<Reply>(`/posts/${postId}/comments`, { content, user });
  return response.data;
};
```

**ポイント**:
- **APIの統一**: 全てのAPIリクエストは、共通の `apiClient` を使用して行われ、`baseURL` やヘッダー設定が統一されています。
- **エラーハンドリング**: APIリクエスト時に失敗した場合は、コンポーネント側でエラーメッセージを表示します。

---

### 5. 型定義 (`types.ts`)

TypeScriptを使用して、各データモデルを厳密に型定義しています。これにより、投稿（スレッド）やコメントのデータ構造が一貫して扱われ、バグが発生しにくくなります。

```typescript
export interface BasePost {
  _id: string;
  user: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reply extends BasePost {
  parentId: string;
  replies: Reply[];
}

export interface Thread extends BasePost {
  replies: Reply[];
}
```

**ポイント**:
- **`Thread` と `Reply` の共通性**: 両者とも `BasePost` を継承し、共通のフィールド（`_id`、`user`、`content` など）を持ちます。
- **`replies` フィールドの再帰性**: `Thread` や `Reply` に含まれる `replies` フィールドは、さらに `Reply` の配列であり、再帰的な構造を実現しています。

---

## まとめ

このReactとTypeScriptを使ったメッセージ投稿アプリは、投稿とコメントを無限にネストして表示する機能を実装しています。`ThreadComponent` の再帰的な設計により、ネストされたコメント構造を簡潔に扱えるようになっています。また、TypeScriptによる型定義を活用することで、データの一貫性と予測可能な挙動を保証しています。APIとの連携も `axios` を使って簡潔に行われており、コード全体が明確に整理されています。
