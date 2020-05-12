const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');
const user = db.collection('user');
const _ = db.command;

Component({
  properties: {
    postId: {
      type: String,
      value: '',
    }
  },

  data: {
    postInfo: {},
    isMark: false,
    isLike: false,
    isShow: false,
    isComment: false,
    isFocus: false,
  },

  lifetimes: {
    ready: function () {
      this._init();
    }
  },

  methods: {
    onTapMark () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      if (this.isHandlingPost) return;

      this.setData({
        isMark: !this.data.isMark
      }, () => {
        this._updatePostMarkOrLike('marks', 'mark');
      });
    },

    onTapLike () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      if (this.isHandlingPost) return;

      this.setData({
        isLike: !this.data.isLike
      }, () => {
        this._updatePostMarkOrLike('likes', 'like');
      });
    },

    onTapComment () {
      this.setData({
        isComment: true,
      }, () => {
        this.setData({
          isFocus: true
        })
      });
    },

    _init () {
      this._checkPostAndUser();
    },

    _jumpToLogin () {
      const path = encodeURIComponent(`${this.route}?id=${this.properties.postId}`);
      wx.navigateTo({
        url: '/pages/login/login?desc=你的認可或批評需要你的登入記錄'
      });
      return;
    },

    _markDone () {
      const { isMark } = this.data;

      this._updateUserData({
        type: !isMark ? 'cancel' : 'add',
        postIds: [this.properties.postId],
        key: 'markPosts'
      });

      // 记录一次mark列表更新
      app.isMarkUpdate = true;

      wx.showToast({
        title: isMark ? '靚 POST 為你 MARK' : '已狠心將你揼',
        icon: 'none'
      });
    },

    _likeDone () {
      const { isLike } = this.data;

      this._updateUserData({
        type: !isLike ? 'cancel' : 'add',
        postIds: [this.properties.postId],
        key: 'likePosts'
      });

      wx.showToast({
        title: isLike ? '點 Like 嘅都係好人' : '多謝你，我會繼續努力',
        icon: 'none'
      });
    },

    async _checkPostAndUser () {
      const res = await wx.cloud.callFunction({
        name: 'checkPostAndUser',
        data: {
          postId: this.properties.postId
        }
      }).catch(() => null);

      if (!res || !res.result || !res.result.postInfo) return;

      const { isMark, isLike, postInfo } = res.result;

      this.setData({
        isMark,
        isLike,
        postInfo,
        isShow: true,
      });
    },

    async _updateUserData (updateData = {}) {
      const res  = await wx.cloud.callFunction({
        name: 'updateUser', 
        data: {
          ...updateData,
        }
      });
    },

    async _updatePostMarkLikeData (updateData, actionType) {
      const res  = await wx.cloud.callFunction({
        name: 'updatePostInfo', 
        data: {
          postId: this.properties.postId,
          updateData,
        }
      }).catch(() => null);

      const nextFlagKey = actionType === 'mark' ? 'isMark' : 'isLike';

      // 異常
      if (!res || !res.result || !res.result.postInfo) {
        this.isHandlingPost = false;

        // 重置
        this.setData({
          [nextFlagKey]: !this.data[nextFlagKey],
        });

        wx.showToast({
          title: actionType === 'mark' ? 'Sorry，收藏失聯咗' : 'Sorry，點贊失聯咗',
          icon: 'none'
        });
        return
      }

      this.setData({
        postInfo: res.result.postInfo
      }, () => {
        this.isHandlingPost = false;
        switch (actionType) {
          case 'mark':
            this._markDone();
            break;

          case 'like':
            this._likeDone();
            break;
        }
      });

    },

    _updatePostMarkOrLike (key, actionType) {
      this.isHandlingPost = true;
      const { isMark, isLike, postInfo } = this.data;
      const isActionMap = {
        mark: isMark,
        like: isLike
      }

      let keyValue = postInfo[key];

      if (typeof keyValue !== 'number') {
        keyValue = 0;
      }

      const updateData = {
        [key]: isActionMap[actionType] ? (keyValue + 1) : (keyValue - 1 < 0 ? 0 : keyValue - 1 ) 
      } 

      this._updatePostMarkLikeData(updateData, actionType);
    },
  }
})
