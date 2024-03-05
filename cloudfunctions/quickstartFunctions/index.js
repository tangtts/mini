const getOpenId = require('./getOpenId/index');
const getMiniProgramCode = require('./getMiniProgramCode/index');
const createCollection = require('./createCollection/index');
const selectCollection = require('./selectCollection/index');
const updateRecord = require('./updateRecord/index');
const sumRecord = require('./sumRecord/index');
const mergePublicData = require('./mergePublicData/index');


// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case 'getOpenId':
      return await getOpenId.main(event, context);
    case 'getMiniProgramCode':
      return await getMiniProgramCode.main(event, context);
    case 'createCollection':
      return await createCollection.main(event, context);
    case 'selectCollection':
      return await selectCollection.main(event, context);
    case 'updateRecord':
      return await updateRecord.main(event, context);
    case 'sumRecord':
      return await sumRecord.main(event, context);
      case 'mergePublicData':
        return await mergePublicData.main(event, context);
  }
};
