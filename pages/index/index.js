import { formatePostData } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const post = db.collection('post');
const MAX_POST = 5;

Page({
  data: {
    isInitLoading: true,
    isPostPageLoading: false,
    isPostPageError: false,
    isInitError: false,
    isShowFilter: false,
    isFilterAct: false,
    postList: [],
    tags: [],
    matchTag: '',
    isTagsLoading: true,
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
    statusBarTitleHeigth: ((wx.getMenuButtonBoundingClientRect().top - wx.getSystemInfoSync().statusBarHeight) * 2) + wx.getMenuButtonBoundingClientRect().height,
    menuBtnRight: wx.getSystemInfoSync().screenWidth - wx.getMenuButtonBoundingClientRect().right,
    menuBtnHeight: wx.getMenuButtonBoundingClientRect().height,
  },

  onLoad () {
    this.init()
  },

  onUnload () {
    clearTimeout(this.actTimer);
  },

  onPullDownRefresh () {
    this.reloadPage();
    this._resetFilter();
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
    if (!this.initFilterTags && !this.data.isShowFilter) {
      this._getFilterTags();
    }

    this._toggleFilterShow();
  },

  onTapFilterBox () {
    this._toggleFilterShow();
  },

  onTapTag (e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({
      matchTag: tag === this.data.matchTag ? '' : tag,
    }, () => {
      this._toggleFilterShow();
      wx.pageScrollTo({
        scrollTop: 0,
        complete: () => {
          this.reloadPage()
        }
      });
    });
  },

  _toggleFilterShow () {
    clearTimeout(this.actTimer);
    if (this.data.isShowFilter) {
      this.setData({
        isFilterAct: false
      }, () => {
        this.actTimer = setTimeout(() => {
          this.setData({
            isShowFilter: false
          })
        }, 300);
      });
    } else {
      this.setData({
        isShowFilter: true
      }, () => {
        this.setData({
          isFilterAct: true
        })
      });
    }
  },

  async _getFilterTags () {
    this.initFilterTags = true;
    const res = await wx.cloud.callFunction({
      name: 'getPostTags'
    }).catch(() => null);

    const { result } = res || {};
    const { tags = [] } = result || {};

    this.setData({
      tags,
      isTagsLoading: false,
    });

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
      postList: [],
    }, () => {
      typeof cb === 'function' && cb();
    });
  },

  _resetFilter () {
    this.initFilterTags = false;
    this.setData({
      isTagsLoading: true,
      tags: [],
      matchTag: '',
    })
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
    const { matchTag } = this.data
    const res = await post.where({
      tags: matchTag ? _.in([matchTag, '$tags']) : _.exists(true)
    }).count();
    if (!res || typeof res.total !== 'number') return;
    this.postTotal = res.total
  },

  async getPostList () {
    const { postList, matchTag } = this.data
    this.isGettingData = true;

    if (!app.isConnected) {
      this.setError();
      return;
    }

    const res = await post
      .where({
        tags: matchTag ? _.in([matchTag, '$tags']) : _.exists(true)
      })
      .orderBy('date', 'desc')
      .skip(postList.length * MAX_POST)
      .limit(MAX_POST)
      .field({
        date: false,
        mdFileId: false,
      })
      .get().catch(() => null);

    if (!res || !res.data) {
      this.setError();
      return;
    }

    this.getPostListDone(res.data);
  }

})
