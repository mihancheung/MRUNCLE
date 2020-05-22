import { showNoNetworkToast } from '../../utils/index';

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

    replyTo: {
      type: String,
      value: ''
    },

    placeHolder: {
      type: String,
      value: '说点什么吧：'
    }
  },

  data: {
    isShowComment: false,
    textValue: '',
  },

  lifetimes: {
    attached () {
      this.type = this.properties.type;
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
      this.postId = postId
    },

    'replyTo': function (replyTo) {
      this.replyTo = replyTo
    },

    'commentId': function (commentId) {
      this.commentId = commentId
    },

    'type': function (type) {
      this.type = type;
    },
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
      this.triggerEvent('closeComment', {textValue: this.inputText})

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
        showNoNetworkToast();
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

      wx.showLoading({
        title: '正在發送'
      });

      let res = null;
      const type = this.type;

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
        wx.hideLoading();
        return
      }

      if (!commentInfo) {
        wx.showToast({
          title: '评论似乎未成功',
          icon: 'none'
        });
        wx.hideLoading();
        return
      }

      let total = {}
      if (type === 'post') {
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