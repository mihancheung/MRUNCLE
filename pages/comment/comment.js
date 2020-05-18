const app = getApp();

Page({
  data: {
    postId: '',
    total: 0,
  },

  onLoad (option) {
    const { id } = option;

    this.setData({
      postId: id
    }, () => {
      this._updateTotal()
    });
  },

  onUnload () {
    app.isReplyCommentsUpdate = false;
  },

  onShow () {
    if (typeof app.comments !== 'number') return;
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
  },
})
