Component({
  properties: {
    openId: {
      type: String,
      value: '',
    },
  },

  data: {
    isLoading: true,
    isError: false,
  },

  lifetimes: {
    attached: function () {
      this.getData();
    }
  },

  methods: {
    getData () {
      console.log('openId', this.properties.openId);
    }
  }
});