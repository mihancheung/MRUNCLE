const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');

Page({
  data: {
    isInitLoading: true,
    isInitError: false,
    postList: []
  },

  onLoad () {
    this.init()
  },

  onPullDownRefresh () {
    this.reloadPage();
    wx.stopPullDownRefresh();
  },

  errorReload () {
    this.reloadPage();
  },

  init () {
    this.getPostList();
  },

  reloadPage () {
    if (!app.isConnected) {
      this.setInitError();
      return;
    }

    this.retsetPageStatus(this.getPostList)
  },

  retsetPageStatus (cb) {
    this.setData({
      isInitLoading: true,
      isInitError: false,
      postList: []
    }, () => {
      typeof cb === 'function' && cb();
    });
  },

  initPostListDone (data) {
    this.setData({
      postList: data,
      isInitLoading: false
    });
  },

  setPullPostListDone (data) {
    this.setData({
      postList: [
        ...postList,
        ...data,
      ],
      isInitLoading: false
    });
  },

  setInitError () {
    this.setData({
      isInitLoading: false,
      isInitError: true,
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
      url: `/pages/post/post?id=${id}`
    });
  },

  async getPostList () {
    if (!app.isConnected) {
      this.setInitError();
      return;
    }

    const { postList } = this.data
    const res = await post.get().catch(() => null);

    if (!res || !res.data) {
      this.setInitError();
      return;
    }

    if (postList.length === 0) {
      this.initPostListDone(res.data);
    } else {
      this.setPullPostListDone(res.data);
    }
  }

})
