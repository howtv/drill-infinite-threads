# メッセージ投稿アプリのAPI解説

このプロジェクトは、ExpressとMongoDBを使用して構築されたメッセージ投稿アプリのAPIです。投稿とコメントを同じコレクションに格納し、親コメントID（`parentId`）を使用して、ツリー状のネストされたコメント構造を実現しています。このドキュメントでは、各機能の詳細や、コードのわかりにくい部分について詳しく説明します。

## プロジェクト構成

- `index.ts`: アプリケーションのエントリーポイント。Expressサーバーのセットアップ、ミドルウェアの設定、MongoDBとの接続が行われます。
- `controllers/messageController.ts`: 投稿やコメントの作成、取得を行うビジネスロジックが含まれています。
- `models/Message.ts`: MongoDBのスキーマ定義で、投稿やコメントのモデルを記述しています。
- `routes/messageRoutes.ts`: 各APIエンドポイントを設定し、それぞれのエンドポイントに対応するコントローラーメソッドを呼び出します。

## 機能の詳細と解説

### 1. 投稿の作成

#### エンドポイント
`POST /api/posts`

#### 機能
新しい投稿（トップレベルのスレッド）を作成します。`parentId`が`null`のため、この投稿は親を持たないスレッドとして扱われます。`author`と`content`は必須フィールドです。

#### コントローラー
`createMessage`メソッドが投稿作成時に呼び出されます。

```typescript
export const createMessage = async (req: Request, res: Response) => {
    try {
        const { content, author } = req.body;
        const { postId } = req.params;
        
        // 必須フィールドのチェック
        if (!content || !author) {
            return res.status(400).json({ error: 'Content and author are required' });
        }
        
        // postIdが存在すればコメントとして、存在しなければ新規投稿として処理
        const message = new Message({ content, parentId: postId || null, author });
        await message.save();
        
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create message' });
    }
};
```

**ポイント**
- **必須フィールドの検証**: `content`と`author`が送信されていない場合、`400 Bad Request`を返します。
- **投稿とコメントの区別**: `postId`がリクエストに含まれればそれはコメントとして扱われ、含まれない場合は新規投稿として扱います。この柔軟な処理により、投稿とコメントの処理を統一しています。

---

### 2. コメントの作成

#### エンドポイント
`POST /api/posts/:postId/comments`

#### 機能
指定された`postId`（親投稿またはコメントのID）に対してコメントを追加します。`author`と`content`は必須です。

#### コントローラー
`createMessage`メソッドが再び呼び出されます。このとき、`parentId`として`postId`が設定されます。

```typescript
// コメントの作成も投稿と同じcreateMessageで処理
const message = new Message({ content, parentId: postId, author });
await message.save();
```

**ポイント**
- **単一メソッドでの処理**: 投稿とコメントの作成処理は同じ`createMessage`メソッドで扱っています。これにより、親を持たない投稿と親を持つコメントを一貫して扱うことができ、コードの重複を防いでいます。

---

### 3. スレッドの取得

#### エンドポイント
`GET /api/posts`

#### 機能
トップレベルの投稿（スレッド）を取得し、それにネストされたコメントを含めたツリー構造を返します。MongoDBの`$graphLookup`を利用して、親子関係を再帰的に追跡しています。

#### コントローラー
`getThreads`メソッドで実装されています。

``typescript
const threads = await Message.aggregate([
    { $match: { parentId: null } },  // トップレベルのスレッドを取得
    {
        $graphLookup: {
            from: 'messages',         // 同じコレクション内で検索
            startWith: '$_id',        // 現在のスレッドIDからリプライを検索
            connectFromField: '_id',  // リプライが親とどのように接続されるかを定義
            connectToField: 'parentId',  // コメントが繋がる親IDのフィールド
            as: 'replies',            // ネストされたコメントのリストとして結果に含める
            depthField: 'depth',      // ネストの深さ（ツリーの深さ）を示すフィールド
        },
    },
    { $sort: { createdAt: -1 } }      // 投稿を作成日時の降順でソート
]);
``

**ポイント**
- **`$graphLookup`の使用**: `from`で同じ`messages`コレクションからリプライを検索し、`connectFromField`と`connectToField`でIDによる親子関係を確立しています。この方法により、単一のクエリでネストされたコメントツリーを効率的に取得できます。
- **ツリー構造の構築**: 取得したスレッドをツリー構造として構築するために、再帰的に`replies`フィールドを追加しています。

**再帰的なコメントのネスト**
```typescript
const buildTree = (message: any, allReplies: any[]): NestedMessage => {
    const children = allReplies.filter(
        (reply) => reply.parentId && reply.parentId.toString() === message._id.toString()
    );
    return {
        ...message,
        replies: children.map((child) => buildTree(child, allReplies)),
    };
};
```

---

### 4. コメントの取得

#### エンドポイント
`GET /api/posts/:postId/comments`

#### 機能
指定された投稿に紐づくすべてのコメントを取得し、それらのコメントにもネストされたリプライが含まれます。

#### コントローラー
`getComments`メソッドで実装されています。

```typescript
const comments = await Message.aggregate([
    { $match: { parentId: new mongoose.Types.ObjectId(postId) } }, // 指定されたpostIdのコメントを取得
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
    { $sort: { createdAt: 1 } }  // コメントは作成日時の昇順で取得
]);
```

**ポイント**
- **postIdによるフィルタリング**: `$match`で指定された`postId`の直下にあるコメントのみを検索し、その後再帰的にリプライを辿るように設計されています。

---

## モデル設計

### `Message`モデル

投稿やコメントの保存には、`Message`モデルを使用します。MongoDBのスキーマで、親コメントや投稿との関係を`parentId`フィールドで管理します。

``typescript
const MessageSchema: Schema = new mongoose.Schema({
    author: { type: String, required: true },    // 投稿者の名前
    content: { type: String, required: true },   // 投稿またはコメントの内容
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },  // 親ID（スレッドの場合はnull）
}, { timestamps: true });  // createdAtとupdatedAtを自動で管理
``

**ポイント**
- **`parentId`フィールド**: 投稿とコメントを同じコレクションに格納し、親子関係を管理するためのフィールドです。トップレベルの投稿（スレッド）の場合は`null`になります。
- **`timestamps`**: MongoDBの機能を利用して、`createdAt`と`updatedAt`フィールドを自動的に管理します。

---

## まとめ

このAPIでは、投稿とコメントをツリー状に管理する柔軟なデータ構造を採用しています。`parentId`を利用することで、親コメントや投稿との関係を管理し、MongoDBの`$graphLookup`を使ってネストされたコメントを効率的に取得しています。

**重要なポイント**:
- 同じ`Message`モデルを使用して、投稿とコメントを管理。
- MongoDBの`$graphLookup`を使用して、ネストされたコメントのツリー構造をクエリで再帰的に構築。
- 一貫性のあるコード構造により、投稿とコメントの処理が同じメソッド内で簡潔に実装されている。

このアプローチにより、複雑なスレッド形式のディスカッションを効率的に管理できます。今後の拡張として、認証の追加や、フロントエンドとの連携によるリアルタイム更新などが考えられます。
