import { formatePostData } from '../../../utils/index';
import { config } from '../../../utils/config';

const towxml = require('./towxml/index');

const db = wx.cloud.database();
const post = db.collection('post');
const POST_MD_CHILD_MAX = 10;

const app = getApp();
Page({
  data: {
    id: '',
    info: {},
    md: {},
    child: [],
    changeComments: 0,
    isError: false,
    isLoading: true,
    isPostRendering: false,
    isShowComment: false,
  },

  onLoad (option) { 
    const { id } = option || {}
    this.setData({
      id
    }, () => {
      this._init();
    });
  },

  onUnload () {
    app.comments = null;
  },

  onShow () {
    const postBar = this.selectComponent('#postBar') || {};
    typeof postBar.onShow === 'function' && postBar.onShow();
  },

  onReachBottom () {
    // 防反復加載渲染
    if (this.isPostTowxml) return;
    const thisReach = this.data.child.length * POST_MD_CHILD_MAX
  
    if (thisReach % this.mdPostLength > 0) {
      const nextReach = thisReach + POST_MD_CHILD_MAX
      this._setMd();

      // 收起文章加載中
      if (nextReach >= this.mdPostLength) {
        this.setData({
          isPostRendering: false
        });
      }
    }
  },

  onPullDownRefresh () {
    clearTimeout(this.timer);
    this._reloadPage();
  },

  onShareAppMessage () {
    return {
      title: this.data.info.title,
      imageUrl: this.data.info.poster
    }
  },

  onShowComment () {
    this.setData({
      isShowComment: true
    });
  },

  onCloseComment () {
    this.setData({
      isShowComment: false
    });
  },

  async onGetComments () {
    const res = await wx.cloud.callFunction({
      name: 'getCommentsTotal',
      data: {
        postId: this.data.id
      }
    })
    .catch(() => null);

    const { result } = res || {};
    const { comments } = result || {}

    this.setData({
      changeComments: comments
    }, () => {
      this._commentDone();
    });
  },

  _commentDone () {
    wx.hideLoading();
    wx.showToast({
      title: '多謝你嘅評論',
      icon: 'none'
    });
  },

  _init () {
    this.postImages = [];
    this.isPostTowxml = false;
    this.mdPostLength = 0;
    this.childLength = 0;
    this.md = null;
    this._getPageInfo();
  },

  errorReload: function () {
    this._reloadPage();
  },

  _reloadPage () {
    wx.stopPullDownRefresh();

    if (!app.isConnected) {
      this._handleError();
      return;
    }

    this._retsetPageStatus(this._init)
  },

  _retsetPageStatus (cb) {
    this.setData({
      info: {},
      md: {},
      child: [],
      isError: false,
      isLoading: true,
      isPostRendering: false,
    }, () => {
      typeof cb === 'function' && cb();
    });
  },

  _getPostImages () {
    const imgs = wx.createSelectorQuery().selectAll('.post_content >>> .h2w__img')
    imgs.fields({
      properties: ['src'],
    }, (rects) => {
      const urls = this._formatPostImages(rects);
      this._setPostImages(urls);
    }).exec();
  },

  _formatPostImages (rects) {
    return rects.map((item) => {
      const { src } = item || {};
      return src;
    })
  },

  _setPostImages (urls) {
    this.postImages = urls;
  },

  _copyJumpLink (href) {
    wx.setClipboardData({
      data: href,
      success () {
        wx.showToast({
          title: '链接已复制',
          icon: 'none'
        })
      }
    });
  },

  _tapPostTag (e) {
    const { currentTarget } = e || {};
    const { dataset } = currentTarget || {};
    const { data } = dataset || {}
    const { attr, tag } = data || {};
    const { src: current, href } = attr || {}
    if (tag !== 'img' && tag !== 'navigator') return;
    if (tag === 'navigator' && !/^https?/i.test(href)) return;
    
    switch (tag) {
      case 'img':
        wx.previewImage({
          current,
          urls: this.postImages
        })
        break;

      case 'navigator':
        this._copyJumpLink(href)
        break;
    }
  },

  _setMd () {
    const { child } = this.data;
    const thisMdLength = child.length;
    this.isPostTowxml = true;

    const nextChild = this.child.filter((item, i) => {
      if (thisMdLength === 0) {
        return i < POST_MD_CHILD_MAX
      }

      return i > thisMdLength * POST_MD_CHILD_MAX - 1 && i < thisMdLength * POST_MD_CHILD_MAX + POST_MD_CHILD_MAX;
    });

    this.setData({
      md: this.md,
      [`child[${child.length}]`]: nextChild,
      isPostRendering: true,
    }, () => {
      this._getPostImages();
      this._handleRenderPostDone();
      this.isPostTowxml = false;
    });
  },

  _mdToWxml (mdFile) {
    if (!mdFile) return;

    const md = towxml(mdFile, 'markdown',{
      base: config.cdnBase,
      theme:'light',
      events: {
        tap: this._tapPostTag
      }
    });

    // 递归去掉多余child的_e属性
    const filterChildE = (child = []) => {
      child.forEach((childItem) => {
        if (childItem.child && childItem.child.length > 0) {
          filterChildE(childItem.child);
        };
        delete childItem._e;
      });
    }

    this.child = md.child.filter((item) => {
      const { type, child = [] } = item || {}
      delete item._e;
      filterChildE(child);
      return type === 'tag'
    });

    this.mdPostLength = this.child.length;
    this.md = md;
    this.md.child = [];
    this.md._e = [];

    this._setMd();
  },

  _handleNextData (data) {
    const info = formatePostData(data);
    const { mdFileId } = info || {}

    this.setData({
      info
    });

    this._getPageMdFile(mdFileId);
  },

  _handleError (errorDesc, isShowErrorReloadBtn = true) {
    this.isPostTowxml = false
    this.setData({
      isError: true,
      isLoading: false,
      isPostRendering: false,
      errorDesc,
      isShowErrorReloadBtn
    });
  },

  _handleRenderPostDone () {
    this.setData({
      isLoading: false,
    });
  },

  async _getPageInfo () {
    if (!app.isConnected) {
      this._handleError();
      return;
    }

    const res = await post.doc(this.data.id).get().catch(() => null);

    if (!res || !res.data) {
      this._handleError();
      return;
    }

    // 需要身份的文章
    if (res.data.role) {
      const roleRes = await wx.cloud.callFunction({
        name: 'getUserRole'
      }).catch(() => null);

      const { result } = roleRes || {};
      const { role } = result || {};

      if (role !== 'admin' && !res.data.role.includes(role)) {
        this._handleError('似乎係私人文章，可揾你老友开通', false);
        return;
      };
    }

    this._handleNextData(res.data);
  },

  async _getPageMdFile (fileID) {
    if (!app.isConnected) {
      this._handleError();
      return;
    }

    const res = await wx.cloud.callFunction({
      name: 'getPostMd',
      data: {
        fileID
      }
    });

    const { result } = res || {};
    const { fileContent } = result || {}

    if (!fileContent) {
      this._handleError();
      return;
    }

    this._mdToWxml(fileContent);
  }
})
