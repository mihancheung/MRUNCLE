import { postDate } from '../../utils/index';

const app = getApp();
const COMMENT_MAX = 10;

Component({
  properties: {
    postId: {
      type: String,
      value: '',
    },

    type: {
      type: String,
      value: 'list'
    }
  },

  data: {
    postId: '',
    list: [],
    userOpenId: '',
    postType: 'post',
    commentId: '',
    placeHolder: '说点什么吧：',
    isIniting: true,
    isLoading: false,
    isShowComment: false,
    isError: false,
  },

  lifetimes: {
    attached () {
      this._init();
    }
  },

  pageLifetimes: {
    show () {
      if (!app.isReplyCommentsUpdate) return;
      app.isReplyCommentsUpdate = false;
      this._updateReplyCommentInfo();
    }
  },

  observers: {
    'postId': function (postId) {
      if (postId === this.data.postId) return;
      this.setData({
        postId
      });
    }
  },

  methods: {
    onReachBottom () {
      if (this.isFetchingList || this.data.list.length * COMMENT_MAX >= this.total) return;
      this._getList();
    },
  
    onPullDownRefresh () {
      this._reloadPage();
    },
  
    onCloseComment (e) {
      const { textValue } = e.detail
      this.inpurtText = textValue;
      let placeHolder = {}

      if (!this.inpurtText) {
        placeHolder = {
          placeHolder: '说点什么吧：'
        }
      }

      this.setData({
        isShowComment: false,
        ...placeHolder
      });
    },
  
    onTapPost () {
      let postType = {}

      if (typeof this.inpurtText === 'string' && !this.inpurtText) {
        postType = {
          postType: 'post',
          placeHolder: '说点什么吧：'
        }
      }

      this.setData({
        ...postType,
        isShowComment: true
      })
    },
  
    onTapPoster (e) {
      const { id, replier, index }  = e.currentTarget.dataset;
      this._replyComment(id, replier, index)
    },
  
    onTapDelete (e) {
      const { id, index }  = e.currentTarget.dataset
      wx.showActionSheet({
        itemList: ['删除评论'],
        itemColor: '#232323',
        success: (res) => {
          if (res.tapIndex === 0) {
            this._deleteComment(id, this.data.postId, index);
          }
        }
      });
    },

    onTapReply (e) {
      const { id, index }  = e.currentTarget.dataset;
      this.commentId = id;
      this.replyIndex = index;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
  
    onCommentDone (e) {
      const { commentInfo } = e.detail
      const { postType } = this.data
  
      if (postType === 'post') {
        this._toCommentDone(commentInfo);
      }
  
      if (postType === 'reply') {
        this._updateReplyCommentInfo();
      }
    },
  
    onErrorReload: function () {
      this._reloadPage();
    },
  
    _init () {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this._getList();
    },
  
    _reloadPage () {
      if (!app.isConnected) {
        this._setError();
        return;
      }
  
      this._resetComponent();
    },
  
    _resetComponent (cb) {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this.setData({
        list: [],
        userOpenId: '',
        postType: 'post',
        commentId: '',
        isIniting: true,
        isLoading: false,
        isShowComment: false,
        isError: false,
      }, () => {
        this._init();
      });
    },
  
    _setError () {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this.setData({
        isIniting: false,
        isError: true,
      });
    },
  
    _toCommentDone (commentInfo) {
      const { list } = this.data;
      const { date } = commentInfo || {};
      commentInfo.date = postDate(date);
      let nextComment = [];
  
      if (!list[0]) {
        nextComment = [[commentInfo]];
      } else {
        nextComment = [...list[0]];
        nextComment.splice(0,0,commentInfo);
      }

      this._updateTotal();
      this.setData({
        [`list[0]`]: nextComment,
        placeHolder: '说点什么吧：',
        postType: 'post'
      }, () => {
        this.dynamicCommentTotal += 1;
        typeof wx.pageScrollTo === 'function' && wx.pageScrollTo({
          scrollTop: 0
        });
      });
    },
  
    _replyComment (id, replier, index) {
      this.commentId = id;
      this.replyIndex = index;
      this.setData({
        placeHolder: `回复 @${replier}：`,
        postType: 'reply',
        commentId: id,
        isShowComment: true,
      });
    },

    async _updateReplyCommentInfo () {
      if (!this.commentId) return;

      const res = wx.cloud.callFunction({
        name: 'getCommentById',
        data: {
          commentId: this.commentId
        }
      });

      const commentRes = await res.catch(() => null);

      const { result } = commentRes || {};
      const { list } = result || {}

      if (!list) return;
      const replyIndex = this.replyIndex
      list.date = postDate(list.date);

      await this._updateTotal();

      this.setData({
        [`list[${replyIndex[0]}][${replyIndex[1]}]`]: list,
        placeHolder: '说点什么吧：',
        postType: 'post'
      });
    },
  
    async _deleteComment (id, postId, index) {
      if (!id || !postId) {
        wx.showToast({
          title: '缺少删除评论条件',
          icon: 'none'
        });
        return;
      };

      wx.showLoading({
        title: '正在刪除'
      });
  
      const res = await wx.cloud.callFunction({
        name: 'deleteComment',
        data: {
          id,
          postId
        }
      }).catch(() => null);

      await this._updateTotal();
      wx.hideLoading();
  
      if (!res) {
        wx.showToast({
          title: '未能成功删除',
          icon: 'none'
        });
        return
      };
  
      this.setData({
        [`list[${index[0]}][${index[1]}]`]: null
      });
  
      wx.showToast({
        title: '删除成功',
        icon: 'none'
      });
  
      this.dynamicCommentTotal -= 1;
    },
  
    async _getList () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }
  
      this.isFetchingList = true;
  
      const res = await wx.cloud.callFunction({
        name: 'getCommentList',
        data: {
          postId: this.data.postId,
          maxCommentList: COMMENT_MAX,
          skip: this.data.list.length * COMMENT_MAX + this.dynamicCommentTotal,
          orderBy: {
            key: 'date',
            type: -1
          }
        }
      });
  
      this.isFetchingList = false;
  
      const { result } = res || {};
      const { total, list, openId: userOpenId } = result || {}
      this.total = total;
      this.triggerEvent('getCommentsTotal', { total })
  
      if (!list) {
        this._setError();
        return;
      };
  
      const nextList = list.map((item) => {
        const { date } = item || {};
        item.date = postDate(date);
        return item;
      });
  
      const nextListLength = this.data.list.length * COMMENT_MAX + COMMENT_MAX
  
      this.setData({
        [`list[${this.data.list.length}]`]: nextList,
        isLoading: nextListLength < this.total,
        userOpenId,
        isIniting: false
      });
    },

    async _updateTotal () {
      const res = await wx.cloud.callFunction({
        name: 'getCommentsTotal',
        data: {
          postId: this.data.postId
        }
      })
      .catch (() => null);

      const { result } = res || {};
      const { comments } = result || {}
      app.comments = comments;

      wx.setNavigationBarTitle({
        title: `${comments || 0}条评论`
      });
    }
  }
});