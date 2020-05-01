import { formatDate } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');

Page({
  data: {
    info: {},
    md: '',
    isError: false,
    isLoading: true,
    postImages: [],
    errorText: '',
  },

  onLoad () {
    this.init()
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
      this.handleNoNetwork();
      return;
    }

    this.retsetPageStatus(this.getPageInfo)
  },

  retsetPageStatus (cb) {
    this.setData({
      isLoading: true,
      isError: false,
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

  tapPostImage (e) {
    const { currentTarget } = e || {};
    const { dataset } = currentTarget || {};
    const { data } = dataset || {}
    const { attr } = data || {};
    const { src: current } = attr || {}
    wx.previewImage({
      current,
      urls: this.data.postImages
    })
  },

  mdToWxml (mdFile) {
    if (!mdFile) return;

    const md = app.towxml(mdFile, 'markdown',{
      base: app.cdnEnvBase,
      theme:'light',
      events: {
        tap: this.tapPostImage
      }
    });

    this.setData({
      md
    }, () => {
      this.getPostImages();
    });
  },

  handleNextData (data) {
    const { date: dataDate, avata: dataAvata, author: dataAuthor } = data;
    const avata = dataAvata || app.postAvata;
    const author = dataAuthor || app.postAuthor;
    const date = formatDate(+new Date(dataDate));

    this.setData({
      info: {
        ...data,
        avata,
        author,
        date,
      }
    });
  },

  handleError (errorText) {
    this.setData({
      errorText,
      isError: true,
      isLoading: false,
    });
  },

  handleGetDataDone () {
    this.setData({
      isLoading: false,
    });
  },

  handleNoNetwork () {
    this.handleError('網絡似乎飛走咗，重新連接後F5');
  },

  async getPageInfo () {
    if (!app.isConnected) {
      this.handleNoNetwork();
      return;
    }

    const postId = '2a625d2b5ea3c6f5001fa82801ea0590';
    const res = await post.doc(postId).get().catch(() => null);

    if (!res || !res.data) {
      this.handleError();
      return;
    }

    this.handleNextData(res.data);
    this.getPageMdFile(res.data.mdFileId);
  },

  async getPageMdFile (mdFileId) {
    if (!app.isConnected) {
      this.handleNoNetwork();
      return;
    }

    const res = await wx.cloud.getTempFileURL({
      fileList: [mdFileId],
    }).catch(() => null);

    if (!app.isConnected || !res || !res.fileList) {
      this.handleError();
      return;
    }

    const url = res.fileList[0] && res.fileList[0].tempFileURL
    const mdFileRes = await app.wxRequire({
      url
    }).catch(() => null);

    this.handleGetDataDone();

    if (!mdFileRes || !mdFileRes.data) {
      this.handleError();
      return;
    }

    this.mdToWxml(mdFileRes.data);
  }
})
