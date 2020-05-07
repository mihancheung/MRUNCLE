const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');

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
    }
  },

  methods: {
    onTapMark () {
      this._updatePostMark();
    },

    onTapLike () {

    },

    _init () {
      this._getPostInfo();
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

    async _updatePostData (updateData) {
      const res  = await wx.cloud.callFunction({
        name: 'updatePostInfo', 
        data: {
          postId: this.properties.postId,
          updateData,
        }
      });

      if (!res.result || !res.result.postInfo) {
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
        wx.showToast({
          title: isMark ? '靚POST為你MARK~' : '忍痛取消咗收藏~',
          icon: 'none'
        });
      });

    },

    _updatePostMark () {
      const { isMark, postInfo } = this.data;
      const marks = postInfo.marks || 0;
      const updateData = {
        marks: isMark ? (marks - 1) : (marks + 1)
      }
      this._updatePostData(updateData);
    }
  }
})
