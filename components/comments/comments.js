import { postDate, showNoNetworkToast } from '../../utils/index';

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
    isEmpty: false,
    replyCommentInfo: {},
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
      const isShowFeedBack = false
      this._updateReplyCommentInfo(isShowFeedBack);
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
      if (this.isFetchingList || this.data.list.length * COMMENT_MAX >= this.initTotal) return;
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
      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

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
      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      const { id, replier, index, item }  = e.currentTarget.dataset;
      this._replyComment(id, replier, index, item)
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
        url: `/article/pages/detail/detail?id=${id}`
      });
    },
  
    onCommentDone (e) {
      const { commentInfo, total } = e.detail
      const { postType } = this.data
  
      if (postType === 'post') {
        this._updateCommentInfo(commentInfo, total);
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
      this.initTotal = 0;
      this.setData({
        list: [],
        userOpenId: '',
        postType: 'post',
        commentId: '',
        isIniting: true,
        isLoading: false,
        isShowComment: false,
        isError: false,
        isEmpty: false,
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
        isEmpty: false
      });
    },

    _jumpToLogin () {
      wx.navigateTo({
        url: '/login/pages/login/login?desc=你的認可或批評需要你的登入記錄'
      });
    },
  
    async _updateCommentInfo (commentInfo, total) {
      const { list } = this.data;
      const { date } = commentInfo || {};
      commentInfo.date = postDate(date);
      let nextComment = [];
      this.dynamicCommentTotal += 1;
  
      if (!list[0]) {
        nextComment = [commentInfo];
      } else {
        nextComment = [...list[0]];
        nextComment.splice(0,0,commentInfo);
      }

      await this._updateTotal().catch(() => null);

      this.setData({
        [`list[0]`]: nextComment,
        placeHolder: '说点什么吧：',
        postType: 'post',
        isEmpty: false,
      }, () => {
        this._commentDone()
        typeof wx.pageScrollTo === 'function' && wx.pageScrollTo({
          scrollTop: 0
        });
      });
    },
  
    _replyComment (id, replier, index, item) {
      this.commentId = id;
      this.replyIndex = index;
      this.setData({
        placeHolder: `回复 @${replier}：`,
        postType: 'reply',
        commentId: id,
        isShowComment: true,
        replyCommentInfo: {
          commentOpenId: item.openId,
          cnt: item.cnt
        },
      });
    },

    _commentDone () {
      wx.hideLoading();
      wx.showToast({
        title: '多謝你嘅評論',
        icon: 'none'
      });
    },

    _setEmpty () {
      this.dynamicCommentTotal = 0;
      this.setData({
        isIniting: false,
        isLoading: false,
        isEmpty: true,
        userOpenId: this.userOpenId
      });
    },

    async _updateReplyCommentInfo (isShowFeedBack = true) {
      if (!this.commentId) {
        wx.hideLoading();
        return;
      };

      const res = wx.cloud.callFunction({
        name: 'getCommentById',
        data: {
          commentId: this.commentId
        }
      });

      const commentRes = await res.catch(() => null);

      const { result } = commentRes || {};
      const { list } = result || {}

      if (!list) {
        wx.hideLoading();
        return;
      };
      const replyIndex = this.replyIndex
      list.date = postDate(list.date);

      await this._updateTotal().catch(() => null);

      this.setData({
        [`list[${replyIndex[0]}][${replyIndex[1]}]`]: list,
        placeHolder: '说点什么吧：',
        postType: 'post'
      }, () => {
        if (!isShowFeedBack) return;
        this._commentDone();
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

      await this._updateTotal().catch(() => null);
      wx.hideLoading();
  
      if (!res) {
        wx.showToast({
          title: '未能成功删除',
          icon: 'none'
        });
        return
      };

      const { result } = res || {}
      const { total } = result || {}

      this.dynamicCommentTotal -= 1;
  
      this.setData({
        [`list[${index[0]}][${index[1]}]`]: null
      }, () => {
        if (total === 0) {
          this._setEmpty();
        }
      });
  
      wx.showToast({
        title: '删除成功',
        icon: 'none'
      });
    },
  
    async _getList () {
      if (!app.isConnected) {
        showNoNetworkToast();
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
      this.initTotal = !this.initTotal ? total : this.initTotal;
      this.triggerEvent('getCommentsTotal', { total });
      this.userOpenId = userOpenId;

      if (total === 0) {
        this._setEmpty();
        return;
      }
  
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
        isLoading: nextListLength < total,
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