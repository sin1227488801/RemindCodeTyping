/**
 * RemindCodeTypingアプリケーション用のユーザードメインモデル
 * 
 * 認証情報、プロフィール情報、およびユーザー関連操作のビジネスロジックを持つ
 * システム内のユーザーエンティティを表現します。このクラスはドメイン駆動設計の
 * 原則に従い、ユーザーの振る舞いをカプセル化し、データの整合性を維持します。
 * 
 * @class User
 * @since 1.0.0
 * @author RCT開発チーム
 * 
 * @example
 * // 通常ユーザーを作成
 * const user = new User('user123', 'john_doe', false, 'jwt_token_here');
 * 
 * @example
 * // ゲストユーザーを作成
 * const guest = User.createGuest();
 * 
 * @example
 * // 認証状態をチェック
 * if (user.isAuthenticated()) {
 *   console.log('ユーザーはログイン中です');
 * }
 * 
 * @example
 * // ストレージ用にシリアライズ
 * const userData = user.toPlainObject();
 * localStorage.setItem('user', JSON.stringify(userData));
 * 
 * @example
 * // ストレージからデシリアライズ
 * const storedData = JSON.parse(localStorage.getItem('user'));
 * const restoredUser = User.fromPlainObject(storedData);
 */
class User {
    /**
     * 提供された認証情報とメタデータで新しいUserインスタンスを作成します
     * 
     * このコンストラクタはすべての入力パラメータを検証し、適切なカプセル化で
     * ユーザーを初期化します。作成タイムスタンプは自動的に現在時刻に設定されます。
     * 
     * @param {string} id - 一意のユーザー識別子（UUID形式推奨）
     * @param {string} loginId - ユーザーのログイン識別子（システム内で一意である必要がある）
     * @param {boolean} [isGuest=false] - これがゲストユーザーアカウントかどうか
     * @param {string|null} [token=null] - API アクセス用のJWT認証トークン
     * 
     * @throws {Error} idが空でない文字列でない場合
     * @throws {Error} loginIdが空でない文字列でない場合
     * 
     * @since 1.0.0
     */
    constructor(id, loginId, isGuest = false, token = null) {
        this.validateConstructorParams(id, loginId);
        
        this._id = id;
        this._loginId = loginId;
        this._isGuest = isGuest;
        this._token = token;
        this._createdAt = new Date();
    }

    /**
     * コンストラクタパラメータを検証します
     * @private
     */
    validateConstructorParams(id, loginId) {
        if (!id || typeof id !== 'string') {
            throw new Error('User ID must be a non-empty string');
        }
        if (!loginId || typeof loginId !== 'string') {
            throw new Error('Login ID must be a non-empty string');
        }
    }

    // Getters
    get id() {
        return this._id;
    }

    get loginId() {
        return this._loginId;
    }

    get isGuest() {
        return this._isGuest;
    }

    get token() {
        return this._token;
    }

    get createdAt() {
        return this._createdAt;
    }

    /**
     * ユーザーが現在認証されているかどうかを判定します
     * 
     * ユーザーは有効なユーザーIDと認証トークンの両方を持っている場合に
     * 認証されているとみなされます。ゲストユーザーは認証戦略に応じて
     * トークンを持つ場合と持たない場合があります。
     * 
     * @returns {boolean} ユーザーがIDとトークンの両方を持つ場合はtrue、そうでなければfalse
     * 
     * @since 1.0.0
     * 
     * @example
     * const user = new User('123', 'john', false, 'token123');
     * console.log(user.isAuthenticated()); // true
     * 
     * @example
     * const userWithoutToken = new User('123', 'john', false, null);
     * console.log(userWithoutToken.isAuthenticated()); // false
     */
    isAuthenticated() {
        return !!this._id && !!this._token;
    }

    /**
     * ユーザーが通常の（ゲストでない）ユーザーかどうかをチェックします
     * @returns {boolean} ユーザーがゲストでない場合はtrue
     */
    isRegularUser() {
        return !this._isGuest;
    }

    /**
     * ユーザーの認証トークンを更新します
     * @param {string} token - 新しい認証トークン
     */
    updateToken(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('Token must be a non-empty string');
        }
        this._token = token;
    }

    /**
     * ユーザーの認証トークンをクリアします
     */
    clearToken() {
        this._token = null;
    }

    /**
     * シリアライゼーション用にユーザーをプレーンオブジェクトに変換します
     * @returns {Object} プレーンオブジェクト表現
     */
    toPlainObject() {
        return {
            id: this._id,
            loginId: this._loginId,
            isGuest: this._isGuest,
            token: this._token,
            createdAt: this._createdAt.toISOString()
        };
    }

    /**
     * プレーンオブジェクトからUserインスタンスを作成します
     * @param {Object} data - プレーンオブジェクトデータ
     * @returns {User} 新しいUserインスタンス
     */
    static fromPlainObject(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be an object');
        }

        const user = new User(data.id, data.loginId, data.isGuest, data.token);
        if (data.createdAt) {
            user._createdAt = new Date(data.createdAt);
        }
        return user;
    }

    /**
     * ゲストユーザーインスタンスを作成します
     * @param {string} guestId - ゲストユーザーID
     * @returns {User} 新しいゲストUserインスタンス
     */
    static createGuest(guestId = null) {
        const id = guestId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new User(id, 'guest', true);
    }

    /**
     * ユーザーデータ構造を検証します
     * @param {Object} userData - 検証するユーザーデータ
     * @returns {boolean} 有効な場合はtrue
     * @throws {Error} 検証が失敗した場合
     */
    static validate(userData) {
        if (!userData || typeof userData !== 'object') {
            throw new Error('User data must be an object');
        }

        if (!userData.id || typeof userData.id !== 'string') {
            throw new Error('User ID must be a non-empty string');
        }

        if (!userData.loginId || typeof userData.loginId !== 'string') {
            throw new Error('Login ID must be a non-empty string');
        }

        if (userData.isGuest !== undefined && typeof userData.isGuest !== 'boolean') {
            throw new Error('isGuest must be a boolean');
        }

        if (userData.token !== undefined && userData.token !== null && typeof userData.token !== 'string') {
            throw new Error('Token must be a string or null');
        }

        return true;
    }

    /**
     * 2つのユーザーが等しいかどうかをチェックします
     * @param {User} other - 比較する他のユーザー
     * @returns {boolean} ユーザーが等しい場合はtrue
     */
    equals(other) {
        if (!(other instanceof User)) {
            return false;
        }
        return this._id === other._id && this._loginId === other._loginId;
    }

    /**
     * ユーザーの文字列表現を返します
     * @returns {string} 文字列表現
     */
    toString() {
        return `User(id=${this._id}, loginId=${this._loginId}, isGuest=${this._isGuest})`;
    }
}

// CommonJSとESモジュールの両方でエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = User;
} else if (typeof window !== 'undefined') {
    window.User = User;
}