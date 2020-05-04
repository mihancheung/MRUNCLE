import { formatDate, formatePostData } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');

Page({
  data: {
    id: '',
    info: {},
    md: '',
    isError: false,
    isLoading: true,
    isMdRendered: true,
    loadingText: '',
    postImages: [],
  },

  onLoad (option) {
    const { id } = option || {}
    this.id = id;
    this.init();
  },

  onPullDownRefresh () {
    this.reloadPage();
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

    this.retsetPageStatus(this.getPageInfo)
  },

  retsetPageStatus (cb) {
    this.setData({
      isLoading: true,
      isError: false,
      loadingText: '',
    }, () => {
      typeof cb === 'function' && cb();
    });
  },

  init () {
    this.getPageInfo();
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
    this.setData({
      postImages: urls
    })
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
          urls: this.data.postImages
        })
        break;

      case 'navigator':
        this.copyJumpLink(href)
        break;
    }
  },

  mdToWxml (mdFile) {
    if (!mdFile) return;
    const { postImages } = this.data

    const md = app.towxml(mdFile, 'markdown',{
      base: app.cdnBase,
      theme:'light',
      events: {
        tap: this.tapPostTag
      }
    });

    this.setData({
      md
    }, () => {
      this.handleRenderPostDone();
      postImages.length === 0 && this.getPostImages();
    });
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
    this.setData({
      isError: true,
      isLoading: false,
      loadingText: '',
    });
  },

  handleRenderPostDone () {
    this.setData({
      isLoading: false,
    });
  },

  getPostDataDone () {
    this.setData({
      loadingText: '文章轉緊義，畀少少耐性'
    })
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

    this.getPostDataDone();

    if (!mdFileRes || !mdFileRes.data) {
      this.handleError();
      return;
    }

    this.mdToWxml(mdFileRes.data);
  }
})
