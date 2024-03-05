// app.js
App({
  data:{
    loc:{
      latitude:"",
      longitude:""
    }
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'test-2gvfkrde8b436040',
        traceUser: true,
      });
    }

    wx.getLocation({
      type: "wgs84",
      // success: this.getLocation
    })

    this.globalData = {
      MAP_KEY: "TZLBZ-SRGRU-DWZVG-GIZPU-OA2HJ-PVBU6"
    };
  },
  getLocation(res){
    wx.request({
      url:`https://apis.map.qq.com/ws/location/v1/ip?key=${this.globalData.MAP_KEY}`,
      success:(res)=>{
        console.log(res)
      }
    })
  }
});
