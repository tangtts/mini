const cloud = require('wx-server-sdk');
const getOpenId = require("../getOpenId");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command
// 创建集合云函数入口函数
exports.main = async (event, context) => {

  const {
    openid
  } = await getOpenId.main(event, context)
  // 应该可以获取当前用户
  const loc = _.geoNear({
    geometry: db.Geo.Point(event.longitude, event.latitude),
    maxDistance: 50000,
  })

  // 公开的
  const publicRes = await db.collection("records").where({
    isPublic: true,
  }).get();

  // 自己非公开的
  const selfData = await db.collection("records").where({
    openId: openid,
    isPublic: _.neq(true),
  }).get();

  const res = publicRes.data.concat(selfData.data);
  return res;
};