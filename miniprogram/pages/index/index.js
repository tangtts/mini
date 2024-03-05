const app = getApp()
const db = wx.cloud.database()
// 这个页面
Page({
  data: {
    latitude: 30.25961,
    longitude: 120.13026,
    location: "杭州市",
    markers: []
  },

  async onLoad() {
    let openId = wx.getStorageSync("openId");
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "mergePublicData",
        openId
      },
      success: (res) => {
        let markers = res.result.map(this.formatMarker);
        this.setData({
          markers
        })
      },
    })
  },

// 格式化marker
  formatMarker(item){
    return ({
      latitude: item.restaurantLat,
        longitude: item.restaurantLng,
         title: item.restaurantName,
        label: item.restaurantName
    })
  },

  navigateToCreatePage() {
    wx.navigateTo({
      url: '/pages/detail/detail',
    })
  },
})