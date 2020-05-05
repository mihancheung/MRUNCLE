import { formatePostData } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');
const POST_MD_CHILD_MAX = 10;

Page({
  data: {
    info: {},
    md: {},
    child: [],
    isError: false,
    isLoading: true,
    isPostRendering: false,
  },

  onLoad (option) {
    const { id } = option || {}
    this.id = id;
    this.init();
  },

  onReachBottom () {
    // 防反復加載渲染
    if (this.isPostTowxml) return;
    const thisReach = this.data.child.length * POST_MD_CHILD_MAX
  
    if (thisReach % this.mdPostLength > 0) {
      const nextReach = thisReach + POST_MD_CHILD_MAX
      this.setMd();

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
    this.reloadPage();
  },

  init () {
    this.postImages = [];
    this.isPostTowxml = false;
    this.mdPostLength = 0;
    this.childLength = 0;
    this.md = null;
    this.getPageInfo();
  },

  errorReload: function () {
    this.reloadPage();
  },

  reloadPage () {
    wx.stopPullDownRefresh();

    if (!app.isConnected) {
      this.handleError();
      return;
    }

    this.retsetPageStatus(this.init)
  },

  retsetPageStatus (cb) {
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

  getPostImages () {
    const imgs = wx.createSelectorQuery().selectAll('.post_content >>> .h2w__img')
    imgs.fields({
      properties: ['src'],
    }, (rects) => {
      const urls = this.formatPostImages(rects);
      this.setPostImages(urls);
    }).exec();
  },

  formatPostImages (rects) {
    return rects.map((item) => {
      const { src } = item || {};
      return src;
    })
  },

  setPostImages (urls) {
    this.postImages = urls;
  },

  copyJumpLink (href) {
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

  tapPostTag (e) {
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
        this.copyJumpLink(href)
        break;
    }
  },

  setMd () {
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
      this.getPostImages();
      this.handleRenderPostDone();
      this.isPostTowxml = false;
    });
  },

  mdToWxml (mdFile) {
    if (!mdFile) return;

    const md = app.towxml(mdFile, 'markdown',{
      base: app.cdnBase,
      theme:'light',
      events: {
        tap: this.tapPostTag
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

    this.setMd();
  },

  handleNextData (data) {
    const info = formatePostData(data);
    const { mdFileId } = info || {}

    this.setData({
      info
    });

    this.getPageMdFile(mdFileId);
  },

  handleError () {
    this.isPostTowxml = false
    this.setData({
      isError: true,
      isLoading: false,
      isPostRendering: false,
    });
  },

  handleRenderPostDone () {
    this.setData({
      isLoading: false,
    });
  },

  async getPageInfo () {
    if (!app.isConnected) {
      this.handleError();
      return;
    }

    const res = await post.doc(this.id).get().catch(() => null);

    if (!res || !res.data) {
      this.handleError();
      return;
    }

    this.handleNextData(res.data);
  },

  async getPageMdFile (mdFileId) {
    if (!app.isConnected) {
      this.handleError();
      return;
    }

    const res = await wx.cloud.getTempFileURL({
      fileList: [mdFileId],
    }).catch(() => null);

    if (!res || !res.fileList) {
      this.handleError();
      return;
    }

    const url = res.fileList[0] && res.fileList[0].tempFileURL
    const mdFileRes = await app.wxRequire({
      url
    }).catch(() => null);

    if (!mdFileRes || !mdFileRes.data) {
      this.handleError();
      return;
    }

    this.mdToWxml(mdFileRes.data);
  }
})
