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
  },

  lifetimes: {
    ready: function () {
      this._init();
    },
    
    detached: function () {
      console.log('detached')
    }
  },

  methods: {
    onTapMark () {
      if (this.isHandlingMark) return;
      this._updatePostMark();
    },

    onTapLike () {

    },

    _init () {
      this._checkIsMark();
      this._getPostInfo();
    },

    async _getOpenId () {
      const reqUserOpenId = wx.cloud.callFunction({
        name: 'getUserInfo',
      });

      const cloudRes = await reqUserOpenId.catch(() => null);
      const { result } = cloudRes || {}

      if (!result || !result.openId) {
        return;
      }

      this.openId = result.openId;
      return result.openId
    },

    async _checkIsMark () {
      const openId = await this._getOpenId();
      if (!openId) return;

      const isMarkRes = await user.where({
        openId,
        markPosts: _.elemMatch(_.eq(this.properties.postId))
      }).get().catch(() => null);

      if (!isMarkRes || !isMarkRes.data || isMarkRes.data.length === 0) return;

      this.setData({
        isMark: true
      });
    },

    async _getPostInfo () {
      const res = await post.where({
        _id: this.properties.postId
      })
      .field({
        comments: true,
        likes: true,
        marks: true
      })
      .get()
      .catch(() => null);

      if (!res || !res.data) return;

      this.setData({
        postInfo: res.data[0],
        isShow: true
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

    async _updatePostData (updateData) {
      const res  = await wx.cloud.callFunction({
        name: 'updatePostInfo', 
        data: {
          postId: this.properties.postId,
          updateData,
        }
      }).catch(() => null);

      if (!res || !res.result || !res.result.postInfo) {
        this.isHandlingMark = false;
        wx.showToast({
          title: '收藏似乎出現咗問題',
          icon: 'none'
        });
        return
      }

      this.setData({
        isMark: !this.data.isMark,
        postInfo: res.result.postInfo
      }, () => {
        const { isMark } = this.data;
        this.isHandlingMark = false;
        wx.showToast({
          title: isMark ? '靚 POST 為你 MARK' : '已狠心將你揼',
          icon: 'none'
        });
      });

    },

    _updatePostMark () {
      const { isMark, postInfo } = this.data;
      let { marks } = postInfo || {};
      if (typeof marks !== 'number') {
        marks = 0;
      }

      this.isHandlingMark = true;

      this._updatePostData({
        marks: isMark ? (marks - 1) : (marks + 1)
      });

      this._updateUserData({
        isMark,
        markPosts: [this.properties.postId]
      });
    }
  }
})
