const { miniProgram } = wx.getAccountInfoSync() || {};
const { envVersion } = miniProgram || {};
const isDev = envVersion === 'develop';

export const config = {
  cdnBase: isDev ? 
    'cloud://dev-c8vh9.6465-dev-c8vh9-1301890037' :
    'cloud://release-vp8ak.7265-release-vp8ak-1301890037',

  cloudEnv: isDev ? 'dev-c8vh9' : 'release-vp8ak'
}
