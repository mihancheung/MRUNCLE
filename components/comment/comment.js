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
    }
  },

  data: {
    isShowComment: false,
    textValue: '',
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
    }
  },

  methods: {
    onBlur () {
      this._closeComment();
    },

    onInput (event) {
      this.inputText = event.detail.value;
    },

    onSubmit (event) {
      const cnt = event.detail.value.cnt || '';
      this._submitComment(this.postId, cnt);
    },

    _closeComment () {
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

    async _submitComment (postId, cnt) {
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

      const res = await wx.cloud.callFunction({
        name: 'toComment',
        data: {
          postId,
          cnt,
        }
      });

      const { result } = res || {}
      const { commentInfo, cntMsg, total } = result || {}

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

      app.comments = total;
      this.triggerEvent('getComments', {
        total,
        commentInfo,
      })
      this._resetForm();
    },
  }
});