import { postDate, showNoNetworkToast } from '../../utils/index';

const app = getApp();
const COMMENT_MAX = 10;

Component({
  properties: {
    commentId: {
      type: String,
      value: '',
    }
  },

  data: {
    postId: '',
    list: [],
    info: {},
    replyItem: null,
    total: '',
    userOpenId: '',
    placeHolder: '',
    replyTo: '',
    commentId: '',
    isIniting: true,
    isLoading: false,
    isShowComment: false,
    isError: false,
    isComment404: false
  },

  lifetimes: {
    attached () {
      this._init();
      this.setData({
        isLogin: app.isLogin
      });
    }
  },

  pageLifetimes: {
    show () {
      if (this.data.isLogin === app.isLogin) return
      this.setData({
        isLogin: app.isLogin
      });
    }
  },

  observers: {
    'commentId': function (commentId) {
      if (commentId === this.data.commentId) return;
      this.setData({
        commentId
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
          placeHolder: '',
          replyTo: '',
          replyItem: null,
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

      this.setData({
        isShowComment: true
      })
    },

    onTapHost () {
      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      this.setData({
        isShowComment: true,
        placeHolder: '',
        replyTo: '',
        replyItem: null,
      })
    },
  
    onTapPoster (e) {
      if (!app.isLogin) {
        this._jumpToLogin();
        return;
      }

      const { replier, replyItem }  = e.currentTarget.dataset;
      this._replyComment(replier, replyItem)
    },
  
    onTapDelete (e) {
      const { id, index }  = e.currentTarget.dataset
      wx.showActionSheet({
        itemList: ['删除评论'],
        itemColor: '#232323',
        success: (res) => {
          if (res.tapIndex === 0) {
            this._deleteComment(id, this.data.commentId, index);
          }
        }
      });
    },
  
    onCommentDone (e) {
      const { commentInfo } = e.detail
      this._updateCommentInfo(commentInfo);
    },
  
    onErrorReload: function () {
      this._reloadPage();
    },
  
    _init () {
      this.isFetchingList = false;
      this.addReplyCommentId = [];
      this.addReplyCommentOpenId = [];
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
  
    _resetComponent () {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this.addReplyCommentId = [];
      this.addReplyCommentOpenId = [];
      this.setData({
        list: [],
        userOpenId: '',
        replyTo: '',
        replyItem: null,
        isIniting: true,
        isLoading: false,
        isShowComment: false,
        isError: false,
        isComment404: false,
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

    _setComment404 () {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this.setData({
        isIniting: false,
        isComment404: true,
      });
    },
  
    async _updateCommentInfo (commentInfo ) {
      const { list } = this.data;
      const { date, _id, openId } = commentInfo || {};
      commentInfo.date = postDate(date);
      this.addReplyCommentId.push(_id);
      this.addReplyCommentOpenId.push(openId);
      app.isReplyCommentsUpdate = true;
      const lastList = list[list.length - 1];

      await this._updateTotal().catch(() => null);

      this.setData({
        [`list[${list.length - 1}][${lastList.length}]`]: commentInfo,
        placeHolder: '',
        replyTo: '',
        replyItem: null,
        total: this.data.total + 1,
      }, () => {
        this._commentDone();
        this.dynamicCommentTotal += 1;
        this.createSelectorQuery().select('#reply-wrapper').boundingClientRect(function(rect){
          typeof wx.pageScrollTo === 'function' && wx.pageScrollTo({
            scrollTop: (rect.height - wx.getSystemInfoSync().screenHeight) + 104
          });
        }).exec();
      });
    },
  
    async _replyComment (replyTo, replyItem) {
      this.setData({
        placeHolder: `回复 @${replyTo}：`,
        replyTo,
        isShowComment: true,
        replyItem,
      });
    },
  
    async _deleteComment (id, commentId, index) {
      if (!id || !commentId) {
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
        name: 'deleteReplyComment',
        data: {
          replyId: id,
          commentId
        }
      }).catch(() => null);

      await this._updateTotal().catch(() => null);

      wx.hideLoading();
  
      if (!res) {
        wx.showToast({
          title: '未能成功删除',
          icon: 'none'
        });
        return;
      };
  
      this.setData({
        [`list[${index[0]}][${index[1]}]`]: null,
        total: this.data.total - 1
      });
  
      wx.showToast({
        title: '删除成功',
        icon: 'none'
      });
  
      this.dynamicCommentTotal -= 1;
      app.isReplyCommentsUpdate = true;
    },

    _commentDone () {
      wx.hideLoading();
      wx.showToast({
        title: '多謝你嘅評論',
        icon: 'none'
      });
    },

    _jumpToLogin () {
      wx.navigateTo({
        url: '/login/pages/login/login?desc=你的認可或批評需要你的登入記錄'
      });
    },
  
    async _getList () {
      if (!app.isConnected) {
        showNoNetworkToast();
        return;
      }
  
      this.isFetchingList = true;
  
      const res = await wx.cloud.callFunction({
        name: 'getReplyCommentList',
        data: {
          commentId: this.data.commentId,
          maxCommentList: COMMENT_MAX,
          skip: this.data.list.length * COMMENT_MAX + this.dynamicCommentTotal,
          orderBy: {
            key: 'date',
            type: 'desc'
          }
        }
      });
  
      this.isFetchingList = false;
  
      const { result } = res || {};
      const { total, replyCommentInfo, openId: userOpenId, commentOpenId, code } = result || {}

      if (code === 404) {
        this._setComment404();
        return;
      }

      if (code === 500) {
        this._setError();
        return;
      }

      this.initTotal = this.initTotal ? total : this.initTotal;
      this.triggerEvent('getReplyTotal', { total })

      const { postId, replies } = replyCommentInfo || [];

      // 格式化日期
      replyCommentInfo.date = postDate(replyCommentInfo.date);
  
      let nextList = replies.map((item) => {
        const { date } = item || {};
        item.date = postDate(date);
        return item;
      });

      if (this.addReplyCommentId.length > 0 && this.addReplyCommentOpenId.length > 0) {
        nextList = nextList.filter((item) => {
          const { _id, openId } = item || {}
          return !this.addReplyCommentId.includes(_id) && this.addReplyCommentOpenId.includes(openId);
        });
      }
  
      const nextListLength = this.data.list.length * COMMENT_MAX + COMMENT_MAX
  
      this.setData({
        info: {
          ...replyCommentInfo,
          replies: null,
          commentOpenId,
        },
        [`list[${this.data.list.length}]`]: nextList,
        isLoading: nextListLength < total,
        userOpenId,
        isIniting: false,
        postId,
        total,
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
    },
  }
});