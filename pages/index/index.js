import { formatePostData } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');
const MAX_POST = 5;

Page({
  data: {
    isInitLoading: true,
    isPostPageLoading: false,
    isPostPageError: false,
    isInitError: false,
    isShowFilter: false,
    postList: [],
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
    statusBarTitleHeigth: ((wx.getMenuButtonBoundingClientRect().top - wx.getSystemInfoSync().statusBarHeight) * 2) + wx.getMenuButtonBoundingClientRect().height,
    menuBtnRight: wx.getSystemInfoSync().screenWidth - wx.getMenuButtonBoundingClientRect().right
  },

  onLoad () {
    this.init()
  },

  onPullDownRefresh () {
    this.reloadPage();
    wx.stopPullDownRefresh();
  },

  onReachBottom () {
    const { isInitError, isPostPageError } = this.data;
    const postListLength = this.data.postList.length * MAX_POST;
    if (isInitError || isPostPageError || this.isGettingData || postListLength >= this.postTotal) return;
    this.getPostList();
  },

  onShareAppMessage () {
    return {
      title: '混跡於互聯網多年不知尚能饭否噶老兵'
    }
  },

  errorReload () {
    this.reloadPage();
  },

  errorPostPageReload () {
    if (!app.isConnected) {
      this.setError();
      return;
    }

    this.setData({
      isPostPageError: false,
      isPostPageLoading: true,
    }, () => {
      this.getPostList();
    });
  },

  onTapFilter () {
    if (!this.initFilterTags) {
      this._getFilterTags();
    }

    this._toggleFilterShow();
  },

  onTapFilterBox () {
    this._toggleFilterShow();
  },

  onTapTag () {
    console.log('32323')
  },

  _toggleFilterShow () {
    this.setData({
      isShowFilter: !this.data.isShowFilter
    });
  },

  _getFilterTags () {

  },

  init () {
    this.postTotal = 0;
    this.isGettingData = false
    this.getPostLength();
    this.getPostList();
  },

  reloadPage () {
    if (!app.isConnected) {
      this.setInitError();
      return;
    }

    this.retsetPageStatus(this.init)
  },

  retsetPageStatus (cb) {
    this.setData({
      isInitLoading: true,
      isPostPageLoading: false,
      isPostPageError: false,
      isInitError: false,
      postList: []
    }, () => {
      typeof cb === 'function' && cb();
    });
  },

  setIsShowPostPageLoading (isShow) {
    this.setData({
      isPostPageLoading: isShow,
    });
  },

  handleIsShowPostPageLoading () {
    const { isPostPageLoading, postList } = this.data;
    const postListTotal = postList.length * MAX_POST;
    if (!isPostPageLoading && postListTotal < this.postTotal) {
      this.setIsShowPostPageLoading(true);
    }

    if (isPostPageLoading && postListTotal >= this.postTotal) {
      this.setIsShowPostPageLoading(false);
    }
  },

  getPostListDone (data) {
    const { postList } = this.data
    const postListLength = postList.length;
    const nextPostList = data.map((item) => {
      return formatePostData(item)
    });

    this.setData({
      [`postList[${postListLength}]`]: nextPostList,
      isInitLoading: false,
    }, () => {
      this.handleIsShowPostPageLoading();
      this.isGettingData = false;
    });
  },

  setError () {
    const { postList } = this.data;
    if (postList.length === 0) {
      this.setInitError();
    }

    this.setPostPageError();
  },

  setPostPageError () {
    this.isGettingData = false;
    this.setData({
      isInitLoading: false,
      isPostPageError: true,
      isPostPageLoading: false,
    });
  },

  setInitError () {
    this.isGettingData = false;
    this.setData({
      isInitLoading: false,
      isInitError: true,
      isPostPageLoading: false,
    });
  },

  onTapPost (e) {
    const { currentTarget } = e || {};
    const { dataset } = currentTarget || {};
    const { id } = dataset || {}
    this.navToPost(id);
  },

  navToPost (id) {
    if (!id) return;
    wx.navigateTo({
      url: `/article/pages/post/post?id=${id}`
    });
  },

  async getPostLength () {
    const res = await post.count();
    if (!res || typeof res.total !== 'number') return;
    this.postTotal = res.total
  },

  async getPostList () {
    const { postList } = this.data
    this.isGettingData = true;

    if (!app.isConnected) {
      this.setError();
      return;
    }

    const res = await post
      .orderBy('date', 'desc')
      .field({
        date: false,
        mdFileId: false,
      })
      .skip(postList.length * MAX_POST)
      .limit(MAX_POST)
      .get().catch(() => null);

    if (!res || !res.data) {
      this.setError();
      return;
    }

    this.getPostListDone(res.data);
  }

})
