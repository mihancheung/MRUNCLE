const app = getApp();

Component({
  properties: {
    postId: {
      type: String,
      value: '',
    },
    isShowComment: {
      type: Boolean,
      value: false,
    },

    type: {
      type: String,
      value: 'post'
    },

    commentId: {
      type: String,
      value: '',
    },

    replier: {
      type: String,
      value: '',
    },

    replyTo: {
      type: String,
      value: '',
    }
  },

  data: {
    isShowComment: false,
    textValue: '',
    placeHolder: '说点什么吧：',
    type: 'post',
    adjustPosition: true,
  },

  lifetimes: {
    attached () {
      this.postId = this.properties.postId;
    }
  },

  observers: {
    'isShowComment': function(isShowComment) {
      if (isShowComment === this.data.isShowComment) return;
      this.setData({
        isShowComment
      });
    },

    'postId': function (postId) {
      if (this.postId === postId) return;
      this.postId = postId
    },

    'commentId': function (commentId) {
      if (this.commentId === commentId) return;
      this.commentId = commentId
    },

    'type': function (type) {
      if (this.type === type) return;
      this.type = type;

      if (type === 'post') {
        this.setData({
          placeHolder: '说点什么吧：'
        });
      }

      if (type === 'reply') {
        this.setData({
          placeHolder: `回复 @${this.replier}：`
        });
      }
    },

    'replyTo': function (replyTo) {
      if (this.replyTo === replyTo) return;
      this.replyTo = replyTo;
    },

    'replier': function (replier) {
      if (this.replier === replier) return;
      this.replier = replier;

      this.setData({
        placeHolder: `回复 @${this.replier}：`
      });
    }
  },

  methods: {
    onBlur () {
      this._closePost();
    },

    onInput (event) {
      this.inputText = event.detail.value;
    },

    onSubmit (event) {
      const cnt = event.detail.value.cnt || '';
      this._submitComment(cnt);
    },

    _closePost () {
      this.triggerEvent('closeComment')

      this.setData({
        textValue: this.inputText
      });
    },

    _resetForm () {
      this.inputText = '';
      this.setData({
        isShowComment: false,
        textValue: '',
      });
    },

    async _submitComment (cnt) {
      const postId = this.postId;
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      if (!cnt.replace(/\s/g, '')) {
        wx.showToast({
          title: '评论尙未有文字',
          icon: 'none'
        });
        this._resetForm();
        return;
      }

      let res = null;
      const { type } = this.data;

      if (type === 'post') {
        res = await wx.cloud.callFunction({
          name: 'toComment',
          data: {
            postId,
            cnt,
          }
        });
      }

      if (type === 'reply') {
        res = await wx.cloud.callFunction({
          name: 'toReplyComment',
          data: {
            id: this.commentId,
            cnt,
            replyTo: this.replyTo
          }
        });
      }

      const { result } = res || {}
      const { commentInfo, cntMsg, total: resultTotal } = result || {}

      if (cntMsg) {
        wx.showToast({
          title: '大佬讲嘢注意D啊',
          icon: 'none'
        });
        return
      }

      if (!commentInfo) {
        wx.showToast({
          title: '评论似乎未成功，请重新再试',
          icon: 'none'
        });
        return
      }

      wx.showToast({
        title: '評論成功，多謝',
        icon: 'none'
      });

      let total = {}
      if (type === 'post') {
        app.comments += 1;
        total = {
          total: resultTotal
        }
      }

      this.triggerEvent('getComments', {
        ...total,
        commentInfo,
      })
      this._resetForm();
    },
  }
});