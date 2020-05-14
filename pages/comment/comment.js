import { formatDate } from '../../utils/index';

const app = getApp();
const COMMENT_MAX = 10;

Page({
  data: {
    postId: '',
    list: [],
    isIniting: true,
    isLoading: false,
    isShowComment: false,
    isError: false,
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
  },

  onLoad (option) {
    const { id } = option || {};
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

  _init () {
    this.isFetchingList = false;
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
        skip: this.data.list.length * COMMENT_MAX,
      }
    });

    this.isFetchingList = false;

    const { result } = res || {};
    const { total, list } = result || {}
    this.total = total;

    if (!list) {
      this._setError();
      return;
    };

    const nextList = list.map((item) => {
      const { date } = item || {};
      item.date = formatDate(date);
      return item;
    });

    const nextListLength = this.data.list.length * COMMENT_MAX + COMMENT_MAX

    this.setData({
      [`list[${this.data.list.length}]`]: nextList,
      isLoading: nextListLength < this.total
    }, () => {
      this._setInitDone();
    });
  },
})
