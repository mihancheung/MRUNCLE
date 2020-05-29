const { miniProgram } = wx.getAccountInfoSync() || {};
const { envVersion: miniProgramEnvVersion } = miniProgram || {};
const envVersion = (__wxConfig && __wxConfig.envVersion) || miniProgramEnvVersion
const isDev = envVersion === 'develop' || envVersion === 'trial';

export const config = {
  isDev,
  cdnBase: isDev ? 
    'cloud://dev-c8vh9.6465-dev-c8vh9-1301890037' :
    'cloud://release-vp8ak.7265-release-vp8ak-1301890037',

  cloudEnv: isDev ? 'dev-c8vh9' : 'release-vp8ak',

  postAvata: '/image/me.jpeg',
  postAuthor: 'MRUNCLE',
}
