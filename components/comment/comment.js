Component({
  properties: {
    postId: {
      type: String,
      value: '',
    }
  },

  data: {
    isComment: true
  },

  lifetimes: {
    attached: function () {
      console.log('this.postId', this.postId)
    }
  },

  methods: {
    onBlur () {
      this.triggerEvent('closeComment')
    }
  }
});