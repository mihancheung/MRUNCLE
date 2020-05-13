import { formatePostData } from '../../utils/index';

const app = getApp();
const COMMENT__MAX = 10;

Page({
  data: {
    postId: '',
    list: [],
    isIniting: true,
    isLoading: false,
    isShowComment: false,
    isError: false,
  },

  onLoad (option) {
    const { id } = option || {};
    this.setData({
      postId: 'e2297d935eaf80f60005ca0c34a394ac'
    });
  },

  onReachBottom () {
    // 防反復加載渲染
    if (this.isFetchingList) return;

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

  init () {
    this.isFetchingList = true;
    this._getList();
  },

  onErrorReload: function () {
    this._reloadPage();
  },

  _reloadPage () {
    if (!app.isConnected) {
      this.handleError();
      return;
    }
  },

  handleError () {
    this.isFetchingList = false
    this.setData({
      isLoadingList: false,
      isError: true,
      list: []
    });
  },

  async _getList () {
    if (!app.isConnected) {
      this.handleError();
      return;
    }
  },
})
