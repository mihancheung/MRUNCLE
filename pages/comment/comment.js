import { postDate } from '../../utils/index';

const app = getApp();
const COMMENT_MAX = 10;

Page({
  data: {
    postId: '',
    list: [],
    userOpenId: '',
    isIniting: true,
    isLoading: false,
    isShowComment: false,
    isError: false,
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
  },

  onLoad (option) {
    const { id, total } = option || {};

    wx.setNavigationBarTitle({
      title: `${total}条评论`
    });

    this.setData({
      postId: id
    }, () => {
      this._init();
    });
  },

  onReachBottom () {
    if (this.isFetchingList || this.data.list.length * COMMENT_MAX >= this.total) return;
    this._getList();
  },

  onPullDownRefresh () {
    this._reloadPage();
    wx.stopPullDownRefresh();
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

  onTapDelete (e) {
    const { id }  = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['删除评论'],
      itemColor: '#232323',
      success: (res) => {
        if (res.tapIndex === 0) {
          this._deleteComment(id, this.data.postId);
        }
      }
    });
  },

  onGetComments (e) {
    const { commentInfo, total } = e.detail
    const list = this.data.list;
    const { date } = commentInfo || {};
    commentInfo.date = postDate(date);
    let nextComment = [];

    if (!list[0]) {
      nextComment = [[commentInfo]];
    } else {
      nextComment = [...list[0]];
      nextComment.splice(0,0,commentInfo);
    }

    this.setData({
      [`list[0]`]: nextComment
    }, () => {
      wx.setNavigationBarTitle({
        title: `${total}条评论`
      });
      this.dynamicCommentTotal += 1;

      typeof wx.pageScrollTo === 'function' && wx.pageScrollTo({
        scrollTop: 0
      });
    });

  },

  _init () {
    this.isFetchingList = false;
    this.dynamicCommentTotal = 0;
    this._getList();
  },

  onErrorReload: function () {
    this._reloadPage();
  },

  _reloadPage () {
    if (!app.isConnected) {
      this._setError();
      return;
    }

    this._resetPage(this._init);
  },

  _resetPage (cb) {
    this.isFetchingList = false;
    this.dynamicCommentTotal = 0;
    this.setData({
      list: [],
      isIniting: true,
      isLoading: false,
      isShowComment: false,
      isError: false,
    }, () => {
      typeof cb === 'function' && cb();
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

  _setInitDone () {
    this.setData({
      isIniting: false
    });
  },

  async _deleteComment (id, postId) {
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
      name: 'getCommentList',
      data: {
        postId: this.data.postId,
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
    const { total, list, openId: userOpenId } = result || {}
    this.total = total;
    app.comments = total;

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
      userOpenId
    }, () => {
      this._setInitDone();
    });
  },
})
