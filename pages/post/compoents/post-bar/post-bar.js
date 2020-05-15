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
    },

    changeComments: {
      type: Number,
      value: 0
    }
  },

  data: {
    postInfo: {},
    isMark: false,
    isLike: false,
    isShow: false,
  },

  lifetimes: {
    ready () {
      this._init();
    }
  },

  observers: {
    'changeComments' (changeComments) {
      if (changeComments !== this.data.postInfo.comments) {
        this.setData({
          'postInfo.comments': changeComments
        });
      }
    }
  },

  methods: {
    onShow () {
      if (typeof app.comments !== 'number') return;
      if (app.comments === this.data.postInfo.comments ) return;

      this.setData({
        'postInfo.comments': app.comments
      });
    },
    onTapMark () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      if (this.isMarking) return;

      this.setData({
        isMark: !this.data.isMark
      }, () => {
        this._updateMarks();
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

      if (this.isLiking) return;

      this.setData({
        isLike: !this.data.isLike
      }, () => {
        this._updateLikes();
      });
    },

    onTapComment () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      this.triggerEvent('showComment');
    },

    onTapCommentList () {
      wx.navigateTo({
        url: `/pages/comment/comment?id=${this.properties.postId}&total=${this.data.postInfo.comments || 0}`
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

      // 记录一次mark列表更新,供个人中心列表更新用
      app.isMarkUpdate = true;

      wx.showToast({
        title: isMark ? '靚 POST 為你 MARK' : '已狠心將你揼',
        icon: 'none'
      });
    },

    _likeDone () {
      const { isLike } = this.data;
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

      const { result } = res || {};
      const { isMark = false, isLike = false, postInfo = {} } = result || {};

      // 缓存文章的评论数
      app.comments = postInfo.comments;

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

    _marksError () {
      const { isMark } = this.data;

      this.setData({
        isMark: !isMark
      });

      wx.showToast({
        title: !isMark ? 'Sorry，取消收藏失败咗' : 'Sorry，收藏失败咗',
        icon: 'none'
      });
    },

    _likesError () {
      const { isLike } = this.data;

      this.setData({
        isLike: !isLike
      });

      wx.showToast({
        title: !isLike ? 'Sorry，取消点赞失败咗' : 'Sorry，点赞失败咗',
        icon: 'none'
      });
    },

    async _updateMarks () {
      const { isMark } = this.data;
      const type = isMark ? 'add' : 'delete';

      if (!this.properties.postId) {
        this._marksError();
        return
      }

      this.isMarking = true;
      const res = await wx.cloud.callFunction({
        name: 'updateMarks',
        data: {
          type,
          postId: this.properties.postId
        }
      }).catch(() => null);
      this.isMarking = false;

      if (!res) {
        this._marksError();
        return;
      }

      const { result } = res || {};
      const { total } = result || {};

      this.setData({
        'postInfo.marks': total,
      }, () => {
        this._markDone();
      });
    },

    async _updateLikes () {
      const { isLike } = this.data;
      const type = isLike ? 'add' : 'delete';

      if (!this.properties.postId) {
        this._likesError();
        return
      }

      this.isLiking = true;
      const res = await wx.cloud.callFunction({
        name: 'updateLikes',
        data: {
          type,
          postId: this.properties.postId
        }
      }).catch(() => null);
      this.isLiking = false;

      if (!res) {
        this._likesError();
        return;
      }

      const { result } = res || {};
      const { total } = result || {};

      this.setData({
        'postInfo.likes': total,
      }, () => {
        this._likeDone();
      });
    },
  }
})
