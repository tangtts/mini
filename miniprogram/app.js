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
    
    this.getCurrentLocation();
    this.globalData = {
        MAP_KEY: "TZLBZ-SRGRU-DWZVG-GIZPU-OA2HJ-PVBU6",
        loc:{
            latitude:30,
            longitude: 120.13026
        }
      };
  },

  getCurrentLocation(){
    wx.getLocation({
        type: "gcj02",
        success: (res) => {
            this.globalData.loc.latitude = res.latitude;
            this.globalData.loc.longitude = res.longitude;
        },
        fail: (err) => {
          console.log(err)
        }
      })
  }
});
