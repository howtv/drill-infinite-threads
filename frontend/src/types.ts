// src/types.ts

// 各返信（Reply）やスレッド（Thread）の共通プロパティを定義します。
export interface BasePost {
    _id: string;            // MongoDBによって自動生成される一意の識別子
    user: string;         // 投稿者の名前またはユーザーID
    content: string;        // 投稿内容
    createdAt: string;      // 投稿日時（ISOフォーマットの文字列）
    updatedAt?: string;     // 更新日時（オプション）
  }
  
  // 返信（Reply）の型定義
  export interface Reply extends BasePost {
    parentId: string;       // 親投稿（スレッドまたは別の返信）のID
    replies: Reply[];       // この返信に対する子返信の配列
  }
  
  // スレッド（Thread）の型定義
  export interface Thread extends BasePost {
    replies: Reply[];       // スレッドに対する最初のレベルの返信の配列
  }
  
  // APIレスポンスの共通型（エラーハンドリングに役立ちます）
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  