import { postDate } from '../../utils/index';

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
    total: '',
    userOpenId: '',
    placeHolder: '',
    replyTo: '',
    commentId: '',
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
      if (this.isFetchingList || this.data.list.length * COMMENT_MAX >= this.total) return;
      this._getList();
    },
  
    onPullDownRefresh () {
      this._reloadPage();
    },
  
    onCloseComment () {
      this.setData({
        isShowComment: false
      });
    },
  
    onTapPost () {
      this.setData({
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
  
    onCommentDone (e) {
      const { commentInfo, total } = e.detail
      this._toCommentDone(commentInfo, total);
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
  
    _resetComponent () {
      this.isFetchingList = false;
      this.dynamicCommentTotal = 0;
      this.setData({
        list: [],
        userOpenId: '',
        replyTo: '',
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
  
    _toReplyCommentDone (commentInfo) {
      const index = this.replyIndex;
      const replies = this.data.list[index[0]][index[1]].replies || []
      const replyLength = replies.length;
      this.setData({
        [`list[${index[0]}][${index[1]}].replies[${replyLength}]`]: commentInfo
      })
    },
  
    _toCommentDone (commentInfo, total ) {
      const { list } = this.data;
      const { date } = commentInfo || {};
      commentInfo.date = postDate(date);

      const listListIndex = list.length === 0 ? 0 : list.length - 1;  
      this.setData({
        [`list[${listListIndex}][${list[listListIndex].length}]`]: commentInfo,
        placeHolder: '',
        replyTo: '',
      }, () => {
        this.dynamicCommentTotal += 1;
        this.createSelectorQuery().select('#reply-wrapper').boundingClientRect(function(rect){
          typeof wx.pageScrollTo === 'function' && wx.pageScrollTo({
            scrollTop: rect.bottom
          });
        }).exec()
      });
    },
  
    async _replyComment (id, replyTo, index) {
      this.replyIndex = index;
      this.setData({
        commentId: id,
        placeHolder: `回复 @${replyTo}：`,
        replyTo,
        isShowComment: true,
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
  
      const res = await wx.cloud.callFunction({
        name: 'deleteComment',
        data: {
          id,
          postId
        }
      }).catch(() => null);
  
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
  
      wx.setNavigationBarTitle({
        title: `${(app.comments - 1) || 0}条评论`
      });
      this.dynamicCommentTotal -= 1;
      app.comments -= 1;
    },
  
    async _getList () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
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
      const { total, replyCommentInfo, openId: userOpenId } = result || {}
      this.total = total;
      app.comments = total;
      this.triggerEvent('getReplyTotal', { total })

      if (!replyCommentInfo) {
        this._setError();
        return;
      };

      const { postId, replies } = replyCommentInfo || []
  
      const nextList = replies.map((item) => {
        const { date } = item || {};
        item.date = postDate(date);
        return item;
      });
  
      const nextListLength = this.data.list.length * COMMENT_MAX + COMMENT_MAX
  
      this.setData({
        info: {
          ...replyCommentInfo,
          replies: null
        },
        [`list[${this.data.list.length}]`]: nextList,
        isLoading: nextListLength < this.total,
        userOpenId,
        isIniting: false,
        postId,
        total,
      });
    },
  }
});