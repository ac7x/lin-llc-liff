/**
 * 本地化設定工具
 */

/**
 * 預設可用的本地化設定
 */
export const AVAILABLE_LOCALES = [
  'en',      // 英文
  'en_EN',   // 英文 (英國)
  'en_US',   // 英文 (美國)
  'zh_TW',   // 繁體中文 (台灣)
  'zh_CN',   // 簡體中文 (中國)
  'ja',      // 日文
  'ko',      // 韓文
  'it',      // 義大利文
  'it_IT',   // 義大利文 (義大利)
  'it_CH',   // 義大利文 (瑞士)
  'nl',      // 荷蘭文
  'nl_NL',   // 荷蘭文 (荷蘭)
  'nl_BE',   // 荷蘭文 (比利時)
  'de',      // 德文
  'de_DE',   // 德文 (德國)
  'fr',      // 法文
  'fr_FR',   // 法文 (法國)
  'fr_CA',   // 法文 (加拿大)
  'fr_BE',   // 法文 (比利時)
  'uk',      // 烏克蘭文
  'uk_UA',   // 烏克蘭文 (烏克蘭)
  'ru',      // 俄文
  'ru_RU',   // 俄文 (俄羅斯)
  'pl',      // 波蘭文
  'pl_PL',   // 波蘭文 (波蘭)
  'pt',      // 葡萄牙文
  'pt_BR',   // 葡萄牙文 (巴西)
  'pt_PT',   // 葡萄牙文 (葡萄牙)
  'sv',      // 瑞典文
  'sv_SE',   // 瑞典文 (瑞典)
  'nb',      // 挪威文 (書面語)
  'nb_NO',   // 挪威文 (書面語, 挪威)
  'nn',      // 挪威文 (新挪威語)
  'nn_NO',   // 挪威文 (新挪威語, 挪威)
  'lt',      // 立陶宛文
  'lt_LT',   // 立陶宛文 (立陶宛)
];

/**
 * 本地化字串定義
 */
export interface LocaleMessages {
  current: string;
  time: string;
  deleteSelected: string;
  [key: string]: string;
}

/**
 * 預設本地化字串 (英文)
 */
export const DEFAULT_LOCALE_MESSAGES: LocaleMessages = {
  current: 'current',
  time: 'time',
  deleteSelected: 'Delete selected'
};

/**
 * 繁體中文本地化字串
 */
export const LOCALE_ZH_TW: LocaleMessages = {
  current: '目前',
  time: '時間',
  deleteSelected: '刪除所選項目'
};

/**
 * 簡體中文本地化字串
 */
export const LOCALE_ZH_CN: LocaleMessages = {
  current: '当前',
  time: '时间',
  deleteSelected: '删除所选项目'
};

/**
 * 日文本地化字串
 */
export const LOCALE_JA: LocaleMessages = {
  current: '現在',
  time: '時間',
  deleteSelected: '選択したアイテムを削除'
};

/**
 * 支援的本地化配置
 */
export const SUPPORTED_LOCALES: { [locale: string]: LocaleMessages } = {
  'en': DEFAULT_LOCALE_MESSAGES,
  'en_EN': DEFAULT_LOCALE_MESSAGES,
  'en_US': DEFAULT_LOCALE_MESSAGES,
  'zh_TW': LOCALE_ZH_TW,
  'zh_CN': LOCALE_ZH_CN,
  'ja': LOCALE_JA
};

/**
 * 取得本地化設定
 * @param locale 語系代碼
 * @returns 本地化訊息物件
 */
export const getLocaleMessages = (locale: string): LocaleMessages => {
  return SUPPORTED_LOCALES[locale] || DEFAULT_LOCALE_MESSAGES;
};

/**
 * 建立自訂本地化設定
 * @param locale 語系代碼
 * @param messages 自訂訊息
 * @returns 合併後的本地化訊息物件
 */
export const createCustomLocale = (locale: string, messages: Partial<LocaleMessages>): LocaleMessages => {
  const baseMessages = getLocaleMessages(locale);
  return {
    ...baseMessages,
    ...messages
  };
};
