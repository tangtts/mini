const app = getApp()
const db = wx.cloud.database();
const _ = db.command
var QQMapWX = require('../../utils/qqmap-wx');
import Dialog from '@vant/weapp/dialog/dialog';
// 这个页面
var qqmapsdk
Page({
  data: {
    latitude: 30.25961,
    longitude: 120.13026,
    location: "",
    markers: []
  },


  async onLoad() {
    qqmapsdk = new QQMapWX({
      key: app.globalData.MAP_KEY
    });
    this.getCurrentLocation();
    this.createMakers();

    const distance = this.calcDistance({
      latitude:39.984060,
      longitude:106.307520,
    })
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
        console.log(err)
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
  formatMarker(item,id) {
    return ({
      id,
      latitude: item.loc.coordinates[1],
      longitude: item.loc.coordinates[0],
      label: {
        content:item.restaurantName,
      }
    })
  },

  bindmarkertap(e){
  let marker =  this.data.markers.find((_,i)=>i === e.markerId)
    console.log(marker)
    if(!marker) return;
    const distance = this.calcDistance({
      latitude:marker.latitude,
      longitude:marker.longitude,
    })
    Dialog.confirm({
      title: marker.label.content,
      message:`距离当前${distance}`
    }).then(() => {
      // on close
    });
  },

  calcDistance({latitude,longitude}){
    console.log(latitude,longitude)
    qqmapsdk.calculateDistance({
      from: '',
      to:`${latitude},${longitude}`,
      success:res=>{
        console.log(res)
      },
      fail:err=>{
        console.log(err)
      }
    })
  },

  navigateToCreatePage() {
    wx.navigateTo({
      url: '/pages/detail/detail',
    })
  },
})