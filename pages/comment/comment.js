const app = getApp();

Page({
  data: {
    postId: '',
    total: 0,
  },

  onLoad (option) {
    const { id, total } = option;
    this.total = total;

    wx.setNavigationBarTitle({
      title: `${total}条评论`
    });

    this.setData({
      postId: id
    });
  },

  onUnload () {
    app.isReplyCommentsUpdate = false;
  },

  onShow () {
    wx.setNavigationBarTitle({
      title: `${app.comments}条评论`
    });
  },

  onReachBottom () {
    const comments = this.selectComponent('#comments') || {};
    typeof comments.onReachBottom === 'function' && comments.onReachBottom();
  },

  onPullDownRefresh () {
    wx.stopPullDownRefresh();
    const comments = this.selectComponent('#comments') || {};
    typeof comments.onPullDownRefresh === 'function' && comments.onPullDownRefresh();
  },

  onGetCommentsTotal (e) {
    const { total } = e.detail
    this.total = total;
  }
})
