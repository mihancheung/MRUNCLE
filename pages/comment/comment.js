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
    if (this.total === total) return;
    this.setData({
      total
    });
  }
})
