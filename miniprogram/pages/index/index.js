const app = getApp()
const db = wx.cloud.database();
const _ = db.command
var QQMapWX = require('../../utils/qqmap-wx');
import Dialog from '@vant/weapp/dialog/dialog';
// 这个页面
var qqmapsdk
Page({
  data: {
    latitude: app.globalData.loc.latitude,
    longitude: app.globalData.loc.longitude,
    location: "",
    markers: []
  },


  async onLoad() {
    qqmapsdk = new QQMapWX({
      key: app.globalData.MAP_KEY
    });
    this.getCurrentLocation();
    this.createMakers();
  },

  getCurrentLocation() {
    if (this.data.location) return;
    wx.getLocation({
      type: "gcj02",
      success: (res) => {
        this.getLocation(res);
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        console.log(err)
      }
    })
  },

  getLocation(location) {
    qqmapsdk.reverseGeocoder({
      location,
      success: (res) => {
        // 设置当前位置
        this.setData({
          location: res.result.address_component.city,
        })
        this.addUserAddress({
          address: res.result.address,
          ...res.result.address_component
        });
      },
      fail: err => {
        Dialog.alert({
          message: err.message,
        }).then(() => {
          // on close
        });
      }
    })
  },


  addUserAddress(addressInfo) {
    // 添加到用户信息
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "getOpenId"
      }
    }).then(async (res) => {
      db.collection("users").where({
        openId: res.result.openid
      }).update({
        data: {
          address: addressInfo.address,
          province: addressInfo.province,
          city: addressInfo.city,
          street: addressInfo.street
        },
        success: res => {
          console.log(res)
        },
        fail: err => {
          console.log(err)
        }
      })
    })
  },

   createMakers() {
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "homeGeo",
        latitude: this.data.latitude,
        longitude: this.data.longitude,
      },
      success: (res) => {
        let markers = res.result.map(this.formatMarker);
        this.setData({
          markers
        })
      },
      fail: err => {
        console.log(err)
      }
    })
  },
  // 格式化marker
  formatMarker(item, id) {
    return ({
      id,
      latitude: item.latitude,
      longitude: item.longitude,
      label: {
        content: item.restaurantName,
        address:item.restaurantAddress
      }
    })
  },

  //   点击marker
  bindmarkertap(e) {
    let marker = this.data.markers.find((_, i) => i === e.markerId)
    console.log(marker)
    if (!marker) return;

    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "getDistance",
        lat1: marker.latitude,
        lng1: marker.longitude,
        lat2: this.data.latitude,
        lng2: this.data.longitude,
      },
      success: (res) => {
        Dialog.confirm({
          title: marker.label.content,
          message: `距离当前${res.result}千米`,
          confirmButtonText:"到这去"
        }).then(() => {
          // on close
          wx.openLocation({
            longitude: marker.longitude,
            latitude: marker.latitude,
            name: marker.label.content,
            address: marker.label.address
          })
        });
      },
    })
  },

  navigateToCreatePage() {
    wx.navigateTo({
      url: '/pages/detail/detail',
    })
  },
})